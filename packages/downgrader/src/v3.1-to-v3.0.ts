/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- this converter is the I/O boundary for untrusted OpenAPI documents: it walks arbitrary input defensively and passes malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Converts OpenAPI 3.1 documents and schemas to OpenAPI 3.0 (targeting the
 * latest patch release, 3.0.4).
 *
 * The conversion never throws: parts that do not match the expected shape
 * are deep-copied through unchanged, a subtree that cycles back into an
 * ancestor object is deep-copied with its cycle preserved instead of
 * converted, and existing specification extensions (`x-` keys) as well as
 * unknown keys are always preserved. Constructs 3.0 cannot express are
 * converted where an equivalent exists and removed otherwise — the converter
 * never invents `x-` keys of its own:
 *
 * - Removed: `webhooks`, `components.pathItems`, `jsonSchemaDialect`,
 *   `info.summary`, and `license.identifier`.
 * - Schema keywords are rewritten where 3.0 has an equivalent (`type` arrays
 *   with `"null"` become `nullable`, `const` becomes a single-value `enum`,
 *   numeric exclusive bounds become bound + boolean, the first entry of
 *   `examples` becomes `example`, `contentEncoding: "base64"` and
 *   `contentMediaType: "application/octet-stream"` become `format: "byte"`
 *   and `format: "binary"`), and dropped where dropping merely loosens
 *   validation (`if`/`then`/`else`, `prefixItems`, `patternProperties`,
 *   `unevaluated*`, `$defs`, `$dynamic*`, ...).
 * - Boolean schemas become `{}` / `{ not: {} }`, and a schema `$ref` with
 *   sibling keywords is wrapped in `allOf` (3.0 references must stand alone).
 * - `mutualTLS` security schemes (and the security requirements referencing
 *   them) are removed, and non-OAuth security requirements lose their role
 *   names, as 3.0 supports neither.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html}
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html}
 */

import type { OpenAPIV3_0, OpenAPIV3_1 } from "@oasty/types";

import type { FieldConverter, FieldTable, UnknownRecord } from "./shared";
import {
  convertRecord,
  deepClone,
  DROP,
  getRef,
  isRecord,
  mapArray,
  mapRecord,
  operationFields,
  setKey,
} from "./shared";

/**
 * 3.0 references stand alone: a Reference Object is reduced to its `$ref`
 * (no `summary`/`description` overrides), anything else is converted.
 */
const convertRefOr = (
  value: unknown,
  convert: (item: unknown) => unknown
): unknown => {
  const ref = getRef(value);
  return ref === undefined ? convert(value) : { $ref: ref };
};

/** Field converter for a map of reference-or-object entries. */
const refMap =
  (convert: (item: unknown) => unknown): FieldConverter =>
  (item) =>
    mapRecord(item, (entry) => convertRefOr(entry, convert));

/** Field converter for a list of reference-or-object entries. */
const refList =
  (convert: (item: unknown) => unknown): FieldConverter =>
  (item) =>
    mapArray(item, (entry) => convertRefOr(entry, convert));

const applyTypes = (
  types: string[],
  schema: UnknownRecord,
  out: UnknownRecord
): void => {
  const nullable = types.includes("null");
  const rest = types.filter((item) => item !== "null");
  if (rest.length === 1) {
    const [single] = rest;
    out.type = single;
    if (nullable) {
      out.nullable = true;
    }
    return;
  }
  if (rest.length === 0) {
    if (!nullable) {
      // `type: []` allows nothing 3.0 can express; drop it.
      return;
    }
    // `type: "null"` alone: 3.0's `nullable` needs a sibling `type`, so a
    // single-value `enum` is the closest expressible form. Sibling `enum`/
    // `const` values intersect with the null type — only null can survive,
    // and a sibling that excludes null leaves a schema matching nothing.
    out.nullable = true;
    if ("const" in schema) {
      // convertConst emits the single-value enum; a non-null const
      // contradicts the null type, so nothing may validate.
      if (schema.const !== null) {
        out.not = {};
      }
      return;
    }
    if (Array.isArray(schema.enum)) {
      if (schema.enum.includes(null)) {
        out.enum = [null];
      } else {
        out.not = {};
      }
      return;
    }
    if (!("enum" in schema)) {
      out.enum = [null];
    }
    return;
  }
  // Multiple non-null types: 3.0 only allows a single `type`, so the type
  // union moves into `anyOf` branches.
  const variants = rest.map((item) => {
    const variant: UnknownRecord = { type: item };
    if (item === "array") {
      // 3.0 requires `items` whenever `type` is "array".
      variant.items = out.items === undefined ? {} : deepClone(out.items);
    }
    if (nullable) {
      variant.nullable = true;
    }
    return variant;
  });
  if (out.anyOf === undefined) {
    out.anyOf = variants;
  } else if (out.allOf === undefined || Array.isArray(out.allOf)) {
    out.allOf = [
      ...(Array.isArray(out.allOf) ? out.allOf : []),
      { anyOf: variants },
    ];
  }
  // With both anyOf occupied and a malformed allOf, the inexpressible type
  // union is dropped rather than clobbering the passed-through allOf.
};

const convertType = (schema: UnknownRecord, out: UnknownRecord): void => {
  const { type } = schema;
  if (type === undefined) {
    return;
  }
  if (typeof type === "string") {
    applyTypes([type], schema, out);
    return;
  }
  if (Array.isArray(type)) {
    const types = [...new Set(type.filter((item) => typeof item === "string"))];
    if (types.length === 0 && type.length > 0) {
      // Only malformed entries: pass the array through unchanged.
      setKey(out, "type", deepClone(type));
      return;
    }
    applyTypes(types, schema, out);
    return;
  }
  // Malformed: pass through.
  setKey(out, "type", deepClone(type));
};

const convertConst = (schema: UnknownRecord, out: UnknownRecord): void => {
  if (!("const" in schema)) {
    return;
  }
  // `const` is a single-value `enum`.
  out.enum = [deepClone(schema.const)];
  if (schema.const === null) {
    out.nullable = true;
  }
};

const convertExamples = (schema: UnknownRecord, out: UnknownRecord): void => {
  // 3.0 only has the singular `example`; the first entry wins, unless an
  // explicit `example` already exists. The rest have no 3.0 home.
  if (
    Array.isArray(schema.examples) &&
    schema.examples.length > 0 &&
    !("example" in schema)
  ) {
    out.example = deepClone(schema.examples[0]);
  }
};

const convertExclusiveBounds = (
  schema: UnknownRecord,
  out: UnknownRecord
): void => {
  const { exclusiveMaximum, exclusiveMinimum, maximum, minimum } = schema;
  // 3.1's numeric exclusive bounds become 3.0's bound + boolean pairs. When
  // an inclusive bound is also present, the tighter constraint wins.
  if (
    typeof exclusiveMinimum === "number" &&
    !(typeof minimum === "number" && minimum > exclusiveMinimum)
  ) {
    out.minimum = exclusiveMinimum;
    out.exclusiveMinimum = true;
  }
  if (
    typeof exclusiveMaximum === "number" &&
    !(typeof maximum === "number" && maximum < exclusiveMaximum)
  ) {
    out.maximum = exclusiveMaximum;
    out.exclusiveMaximum = true;
  }
};

const convertContentKeywords = (
  schema: UnknownRecord,
  out: UnknownRecord
): void => {
  // 3.1 replaced 3.0's `format: "byte"` / `format: "binary"` with the JSON
  // Schema content keywords; reconstruct the formats when unambiguous.
  if (out.format !== undefined) {
    return;
  }
  if (schema.contentEncoding === "base64") {
    out.format = "byte";
    return;
  }
  if (
    schema.contentEncoding === undefined &&
    schema.contentMediaType === "application/octet-stream"
  ) {
    out.format = "binary";
  }
};

/**
 * 3.1 documents produced from 3.2 ones may carry the 3.2 `nodeType` field
 * in XML Objects (tolerated by the standard 3.1 document schema, though
 * the OAS base-vocabulary meta-schema closes XML Objects to `x-` extras;
 * 3.0 forbids it outright): it maps back to the `attribute`/`wrapped`
 * flags where expressible and is removed.
 */
const convertXml = (value: unknown, schemaType: unknown): unknown =>
  convertRecord(value, { nodeType: DROP }, (out, xml) => {
    if (xml.nodeType === "attribute") {
      out.attribute = true;
    } else if (
      xml.nodeType === "element" &&
      (schemaType === "array" ||
        (Array.isArray(schemaType) && schemaType.includes("array")))
    ) {
      out.wrapped = true;
    }
    return out;
  });

/** Converts the keywords whose 3.0 form depends on several 3.1 keywords at once. */
const finishSchema = (
  out: UnknownRecord,
  schema: UnknownRecord
): UnknownRecord => {
  convertType(schema, out);
  convertConst(schema, out);
  convertExamples(schema, out);
  convertExclusiveBounds(schema, out);
  convertContentKeywords(schema, out);
  if (out.type === "array" && out.items === undefined) {
    // 3.0 requires `items` whenever `type` is "array".
    out.items = {};
  }
  const ref = schema.$ref;
  if (typeof ref === "string") {
    if (out.allOf === undefined || Array.isArray(out.allOf)) {
      // 3.0 references must stand alone: keep the siblings and move the
      // reference into an `allOf` member.
      out.allOf = [
        { $ref: ref },
        ...(Array.isArray(out.allOf) ? out.allOf : []),
      ];
    } else {
      // A malformed allOf passes through, so the reference stays in place.
      setKey(out, "$ref", ref);
    }
  }
  return out;
};

const convertSchema = (schema: unknown): unknown => {
  if (schema === true) {
    return {};
  }
  if (schema === false) {
    return { not: {} };
  }
  if (
    isRecord(schema) &&
    typeof schema.$ref === "string" &&
    Object.keys(schema).length === 1
  ) {
    return { $ref: schema.$ref };
  }
  // oxlint-disable-next-line no-use-before-define -- mutually recursive with the field table, as schemas are recursive structures
  return convertRecord(schema, SCHEMA_FIELDS, finishSchema);
};

const convertSubschemas: FieldConverter = (item) =>
  mapArray(item, convertSchema);

/**
 * Every 3.1 Schema Object keyword 3.0 treats differently; the rest (including
 * unknown keywords and `x-` extensions) is copied as it is. Keywords with no
 * 3.0 equivalent are dropped: in positive schema positions this only loosens
 * validation — the safe direction for a downgrade. Inside `not` (where
 * loosening the operand tightens the whole) or between `oneOf` branches
 * (where loosening one branch can break exclusivity) the semantics can
 * shift; see the README's known limitations. Keywords `finishSchema`
 * rewrites from their raw values are dropped here as well.
 */
const SCHEMA_FIELDS: FieldTable = {
  $anchor: DROP,
  $comment: DROP,
  $defs: DROP,
  $dynamicAnchor: DROP,
  $dynamicRef: DROP,
  $id: DROP,
  // A string $ref is re-attached by finishSchema; malformed values pass
  // through unchanged.
  $ref: (item) => (typeof item === "string" ? DROP : deepClone(item)),
  $schema: DROP,
  $vocabulary: DROP,
  // With `patternProperties` dropped, `additionalProperties` would also
  // constrain the previously pattern-matched keys, so it is dropped alongside
  // (removing a constraint is the safe direction). Booleans are valid in 3.0.
  additionalProperties: (item, schema) => {
    if ("patternProperties" in schema) {
      return DROP;
    }
    return typeof item === "boolean" ? item : convertSchema(item);
  },
  allOf: convertSubschemas,
  anyOf: convertSubschemas,
  const: DROP,
  contains: DROP,
  contentEncoding: DROP,
  contentMediaType: DROP,
  contentSchema: DROP,
  dependentRequired: DROP,
  dependentSchemas: DROP,
  else: DROP,
  // 3.0 requires at least one enum entry; an empty enum only constrains, so
  // removing it is the safe direction.
  enum: (item) =>
    Array.isArray(item) && item.length === 0 ? DROP : deepClone(item),
  examples: DROP,
  // Numeric bounds are rewritten by finishSchema; 3.0-style booleans (invalid
  // in 3.1, but accepted gracefully) pass through.
  exclusiveMaximum: (item) =>
    typeof item === "number" ? DROP : deepClone(item),
  exclusiveMinimum: (item) =>
    typeof item === "number" ? DROP : deepClone(item),
  if: DROP,
  // With `prefixItems` dropped, a trailing `items` would wrongly constrain
  // every item, so it is dropped alongside.
  items: (item, schema) =>
    "prefixItems" in schema ? DROP : convertSchema(item),
  maxContains: DROP,
  minContains: DROP,
  not: convertSchema,
  oneOf: convertSubschemas,
  patternProperties: DROP,
  prefixItems: DROP,
  properties: (item) => mapRecord(item, convertSchema),
  propertyNames: DROP,
  // 3.0 requires the array to be non-empty with unique entries.
  required: (item) => {
    if (!Array.isArray(item)) {
      return deepClone(item);
    }
    const unique = [...new Set(item)];
    return unique.length === 0 ? DROP : deepClone(unique);
  },
  // oxlint-disable-next-line unicorn/no-thenable -- the JSON Schema `then` keyword; the table is never awaited
  then: DROP,
  type: DROP,
  unevaluatedItems: DROP,
  unevaluatedProperties: DROP,
  xml: (item, schema) => convertXml(item, schema.type),
};

/**
 * Converts an OpenAPI 3.1 Schema Object to its OpenAPI 3.0 form. A schema
 * consisting solely of `$ref` becomes a 3.0 Reference Object; a `$ref` with
 * sibling keywords is wrapped in `allOf`. See the module documentation for
 * the full keyword mapping.
 */
export const downgradeSchemaV31ToV30 = <T = unknown>(
  schema: OpenAPIV3_1.SchemaObject<T>
): OpenAPIV3_0.ReferenceObject | OpenAPIV3_0.SchemaObject<T> => {
  const converted: unknown = convertSchema(schema);
  // SAFETY: convertSchema rewrites every 3.1-only keyword into its 3.0 form.
  return converted as OpenAPIV3_0.ReferenceObject | OpenAPIV3_0.SchemaObject<T>;
};

const SECURITY_SCHEMES_REF_PREFIX = "#/components/securitySchemes/";

interface SecuritySchemeIndex {
  /** Names of `mutualTLS` schemes, which 3.0 cannot represent at all. */
  mutualTls: Set<string>;
  /** Scheme name to declared `type`, for every recognizable scheme. */
  types: Map<string, string>;
}

/**
 * Resolves the declared `type` of a security scheme, following local
 * reference aliases with cycle protection.
 */
const resolveSchemeType = (
  name: string,
  schemes: UnknownRecord,
  seen: Set<string>
): string | undefined => {
  if (seen.has(name) || !Object.hasOwn(schemes, name)) {
    return undefined;
  }
  const scheme = schemes[name];
  if (!isRecord(scheme)) {
    return undefined;
  }
  if (typeof scheme.type === "string") {
    return scheme.type;
  }
  const ref = getRef(scheme);
  if (ref !== undefined && ref.startsWith(SECURITY_SCHEMES_REF_PREFIX)) {
    const target = ref.slice(SECURITY_SCHEMES_REF_PREFIX.length);
    if (target !== "" && !target.includes("/")) {
      seen.add(name);
      return resolveSchemeType(target, schemes, seen);
    }
  }
  return undefined;
};

const indexSecuritySchemes = (spec: unknown): SecuritySchemeIndex => {
  const index: SecuritySchemeIndex = { mutualTls: new Set(), types: new Map() };
  const components = isRecord(spec) ? spec.components : undefined;
  const schemes = isRecord(components) ? components.securitySchemes : undefined;
  if (!isRecord(schemes)) {
    return index;
  }
  for (const name of Object.keys(schemes)) {
    const type = resolveSchemeType(name, schemes, new Set());
    if (type !== undefined) {
      index.types.set(name, type);
      if (type === "mutualTLS") {
        // Reference aliases of mutualTLS schemes are removed as well, so no
        // dangling references survive.
        index.mutualTls.add(name);
      }
    }
  }
  return index;
};

const convertRequirement = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const entries = Object.entries(value);
  const kept = entries.filter(([name]) => !index.mutualTls.has(name));
  if (kept.length === 0 && entries.length > 0) {
    // A requirement that only referenced mutualTLS schemes disappears; an
    // originally empty `{}` (optional security) is kept.
    return DROP;
  }
  return Object.fromEntries(
    kept.map(([name, scopes]) => {
      // 3.0 allows roles only on OAuth-family schemes; roles on unknown
      // schemes are left alone.
      const type = index.types.get(name);
      const scoped =
        type === undefined || type === "oauth2" || type === "openIdConnect";
      return [name, Array.isArray(scopes) && !scoped ? [] : deepClone(scopes)];
    })
  );
};

/**
 * Converts a `security` list. When mutualTLS removal empties a previously
 * non-empty list, the whole field is dropped: an explicit empty `security`
 * array means "no security required" and, on an operation, would override
 * the root declaration and silently make the operation public.
 */
const convertSecurity = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!Array.isArray(value)) {
    return deepClone(value);
  }
  const out = value
    .map((item) => convertRequirement(item, index))
    .filter((item) => item !== DROP);
  return value.length > 0 && out.length === 0 ? DROP : out;
};

const convertInfo = (value: unknown): unknown =>
  convertRecord(value, {
    // No SPDX `identifier` and no `summary` in 3.0.
    license: (item) => convertRecord(item, { identifier: DROP }),
    summary: DROP,
  });

/** Parameter Objects and Header Objects share every field this converter touches. */
const convertParameterOrHeader = (value: unknown): unknown =>
  convertRecord(
    value,
    {
      // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertMediaType via encoding headers
      content: (item) => mapRecord(item, convertMediaType),
      examples: refMap(deepClone),
      schema: convertSchema,
    },
    (out, parameter) => {
      if (parameter.in === "path") {
        // 3.0 requires `required: true` on every path parameter; 3.1 only
        // structurally enforces it for schema-based ones.
        out.required = true;
      }
      return out;
    }
  );

const convertEncoding = (value: unknown): unknown =>
  convertRecord(value, { headers: refMap(convertParameterOrHeader) });

const convertMediaType = (value: unknown): unknown =>
  convertRecord(value, {
    encoding: (item) => mapRecord(item, convertEncoding),
    examples: refMap(deepClone),
    schema: convertSchema,
  });

const convertContent: FieldConverter = (item) =>
  mapRecord(item, convertMediaType);

const convertRequestBody = (value: unknown): unknown =>
  convertRecord(value, { content: convertContent });

const convertResponse = (value: unknown): unknown =>
  convertRecord(value, {
    content: convertContent,
    headers: refMap(convertParameterOrHeader),
    links: refMap(deepClone),
  });

const convertResponses: FieldConverter = (item) =>
  mapRecord(item, (entry, key) =>
    key.startsWith("x-")
      ? deepClone(entry)
      : convertRefOr(entry, convertResponse)
  );

const convertOperation = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown =>
  convertRecord(
    value,
    {
      // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertCallback, as callbacks contain path items
      callbacks: refMap((item) => convertCallback(item, index)),
      parameters: refList(convertParameterOrHeader),
      requestBody: (item) => convertRefOr(item, convertRequestBody),
      responses: convertResponses,
      security: (item) => convertSecurity(item, index),
    },
    (out) => {
      if (out.responses === undefined) {
        // Required and non-empty in 3.0, optional in 3.1: a minimal default
        // response keeps the output valid against the official 3.0 schema.
        out.responses = { default: { description: "" } };
      }
      return out;
    }
  );

const convertCallback = (value: unknown, index: SecuritySchemeIndex): unknown =>
  mapRecord(value, (item, key) =>
    // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertPathItem, as path items contain callbacks
    key.startsWith("x-") ? deepClone(item) : convertPathItem(item, index)
  );

const convertPathItem = (value: unknown, index: SecuritySchemeIndex): unknown =>
  convertRecord(value, {
    ...operationFields((item) => convertOperation(item, index)),
    parameters: refList(convertParameterOrHeader),
  });

const convertPaths = (value: unknown, index: SecuritySchemeIndex): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("/") ? convertPathItem(item, index) : deepClone(item)
  );

const convertComponents = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown =>
  convertRecord(value, {
    callbacks: refMap((item) => convertCallback(item, index)),
    examples: refMap(deepClone),
    headers: refMap(convertParameterOrHeader),
    links: refMap(deepClone),
    parameters: refMap(convertParameterOrHeader),
    // 3.0 has no reusable path items.
    pathItems: DROP,
    requestBodies: refMap(convertRequestBody),
    responses: refMap(convertResponse),
    schemas: (item) => mapRecord(item, convertSchema),
    securitySchemes: (item) =>
      mapRecord(item, (scheme, name) =>
        index.mutualTls.has(name) ? DROP : convertRefOr(scheme, deepClone)
      ),
  });

const convertSpec = (spec: unknown): unknown => {
  const index = indexSecuritySchemes(spec);
  return convertRecord(
    spec,
    {
      components: (item) => convertComponents(item, index),
      info: convertInfo,
      // 3.0 has neither schema-dialect selection nor webhooks.
      jsonSchemaDialect: DROP,
      paths: (item) => convertPaths(item, index),
      security: (item) => convertSecurity(item, index),
      webhooks: DROP,
    },
    (out) => {
      out.openapi = "3.0.4";
      if (out.paths === undefined) {
        // Required in 3.0; an empty Paths Object is valid.
        out.paths = {};
      }
      return out;
    }
  );
};

/**
 * Converts an OpenAPI 3.1 document to OpenAPI 3.0.4. The input is never
 * mutated, unknown keys and specification extensions are preserved, and
 * malformed parts are copied through unchanged instead of throwing.
 */
export const downgradeSpecV31ToV30 = (
  spec: OpenAPIV3_1.OpenAPIObject
): OpenAPIV3_0.OpenAPIObject => {
  const converted: unknown = convertSpec(spec);
  // SAFETY: convertSpec rewrites every 3.1-only construct into its 3.0 form.
  return converted as OpenAPIV3_0.OpenAPIObject;
};
