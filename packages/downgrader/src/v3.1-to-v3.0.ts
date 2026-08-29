/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- this converter is the I/O boundary for untrusted OpenAPI documents: it walks arbitrary input defensively and passes malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Converts OpenAPI 3.1 documents and schemas to OpenAPI 3.0 (targeting the
 * latest patch release, 3.0.4).
 *
 * The conversion never throws on JSON-shaped (acyclic) input: parts that do
 * not match the expected shape are deep-copied through unchanged, and
 * existing specification extensions (`x-` keys) as well as unknown keys are
 * always preserved. Constructs 3.0
 * cannot express are converted where an equivalent exists and removed
 * otherwise — the converter never invents `x-` keys of its own:
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

import type { UnknownRecord } from "./shared";
import {
  deepClone,
  getRef,
  isRecord,
  mapArray,
  mapRecord,
  omitKeys,
  setKey,
} from "./shared";

const HTTP_METHODS = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]);

/**
 * JSON Schema keywords with no OpenAPI 3.0 equivalent. In positive schema
 * positions, dropping them only loosens validation — the safe direction for
 * a downgrade. Inside `not` (where loosening the operand tightens the
 * whole) or between `oneOf` branches (where loosening one branch can break
 * exclusivity) the semantics can shift; see the README's known limitations.
 */
const DROPPED_SCHEMA_KEYWORDS = new Set([
  "$anchor",
  "$comment",
  "$defs",
  "$dynamicAnchor",
  "$dynamicRef",
  "$id",
  "$schema",
  "$vocabulary",
  "contains",
  "contentSchema",
  "dependentRequired",
  "dependentSchemas",
  "else",
  "if",
  "maxContains",
  "minContains",
  "patternProperties",
  "prefixItems",
  "propertyNames",
  "then",
  "unevaluatedItems",
  "unevaluatedProperties",
]);

/** Keywords converted after the main loop, from their raw values. */
const POSTPROCESSED_SCHEMA_KEYWORDS = new Set([
  "const",
  "contentEncoding",
  "contentMediaType",
  "examples",
  "type",
]);

interface SecuritySchemeIndex {
  /** Names of `mutualTLS` schemes, which 3.0 cannot represent at all. */
  mutualTls: Set<string>;
  /** Scheme name to declared `type`, for every recognizable scheme. */
  types: Map<string, string>;
}

/**
 * Strips a 3.1 Reference Object down to its bare `$ref` (3.0 references
 * allow no `summary`/`description` overrides), or converts the value.
 */
const convertRefOr = (
  value: unknown,
  convert: (item: unknown) => unknown
): unknown => {
  const ref = getRef(value);
  if (ref !== undefined) {
    return { $ref: ref };
  }
  return convert(value);
};

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
    // single-value `enum` is the closest expressible form.
    out.nullable = true;
    if (!("enum" in schema) && !("const" in schema)) {
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
  if (!("examples" in schema)) {
    return;
  }
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
 * 3.1 documents produced from 3.2 ones may carry the 3.2 `nodeType` field in
 * XML Objects (a legal extra key in 3.1, but 3.0 forbids unknown XML Object
 * fields): it maps back to the `attribute`/`wrapped` flags where expressible
 * and is removed.
 */
const convertXml = (value: unknown, schemaType: unknown): unknown => {
  if (!isRecord(value) || !("nodeType" in value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key !== "nodeType") {
      setKey(out, key, deepClone(item));
    }
  }
  if (value.nodeType === "attribute") {
    out.attribute = true;
  } else if (
    value.nodeType === "element" &&
    (schemaType === "array" ||
      (Array.isArray(schemaType) && schemaType.includes("array")))
  ) {
    out.wrapped = true;
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
  if (!isRecord(schema)) {
    return deepClone(schema);
  }
  const ref = schema.$ref;
  if (typeof ref === "string" && Object.keys(schema).length === 1) {
    return { $ref: ref };
  }
  // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertSchemaFields, as schemas are recursive structures
  const out = convertSchemaFields(schema);
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

/** Converts the keywords holding nested schemas; returns whether `key` was one. */
const convertSubschemaKeyword = (
  out: UnknownRecord,
  key: string,
  value: unknown,
  schema: UnknownRecord
): boolean => {
  switch (key) {
    case "allOf":
    case "anyOf":
    case "oneOf": {
      setKey(out, key, mapArray(value, convertSchema));
      return true;
    }
    case "items": {
      // With `prefixItems` dropped, a trailing `items` would wrongly
      // constrain every item, so it is dropped alongside.
      if (!("prefixItems" in schema)) {
        setKey(out, key, convertSchema(value));
      }
      return true;
    }
    case "not": {
      setKey(out, key, convertSchema(value));
      return true;
    }
    case "properties": {
      setKey(out, key, mapRecord(value, convertSchema));
      return true;
    }
    case "additionalProperties": {
      // With `patternProperties` dropped, `additionalProperties` would also
      // constrain the previously pattern-matched keys, so it is dropped
      // alongside (removing a constraint is the safe direction).
      if (!("patternProperties" in schema)) {
        setKey(
          out,
          key,
          typeof value === "boolean" ? value : convertSchema(value)
        );
      }
      return true;
    }
    default: {
      return false;
    }
  }
};

const convertSchemaFields = (schema: UnknownRecord): UnknownRecord => {
  const out: UnknownRecord = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === "$ref") {
      // A string $ref is re-attached by convertSchema; malformed values pass
      // through unchanged.
      if (typeof value !== "string") {
        setKey(out, key, deepClone(value));
      }
      continue;
    }
    if (
      DROPPED_SCHEMA_KEYWORDS.has(key) ||
      POSTPROCESSED_SCHEMA_KEYWORDS.has(key)
    ) {
      continue;
    }
    if (convertSubschemaKeyword(out, key, value, schema)) {
      continue;
    }
    if (
      (key === "exclusiveMaximum" || key === "exclusiveMinimum") &&
      typeof value === "number"
    ) {
      // Converted after the loop; 3.0-style booleans (invalid in 3.1, but
      // accepted gracefully) pass through the default clone below.
      continue;
    }
    if (key === "required" && Array.isArray(value)) {
      // 3.0 requires the array to be non-empty with unique entries.
      const unique = [...new Set(value)];
      if (unique.length > 0) {
        setKey(out, key, deepClone(unique));
      }
      continue;
    }
    if (key === "enum" && Array.isArray(value) && value.length === 0) {
      // 3.0 requires at least one enum entry; an empty enum only constrains,
      // so removing it is the safe direction.
      continue;
    }
    if (key === "xml") {
      setKey(out, key, convertXml(value, schema.type));
      continue;
    }
    setKey(out, key, deepClone(value));
  }

  convertType(schema, out);
  convertConst(schema, out);
  convertExamples(schema, out);
  convertExclusiveBounds(schema, out);
  convertContentKeywords(schema, out);

  if (out.type === "array" && out.items === undefined) {
    // 3.0 requires `items` whenever `type` is "array".
    out.items = {};
  }
  return out;
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

const indexSecuritySchemes = (spec: UnknownRecord): SecuritySchemeIndex => {
  const types = new Map<string, string>();
  const mutualTls = new Set<string>();
  const schemes = isRecord(spec.components)
    ? spec.components.securitySchemes
    : undefined;
  if (isRecord(schemes)) {
    for (const name of Object.keys(schemes)) {
      const type = resolveSchemeType(name, schemes, new Set());
      if (type !== undefined) {
        types.set(name, type);
        if (type === "mutualTLS") {
          // Reference aliases of mutualTLS schemes are removed as well, so
          // no dangling references survive.
          mutualTls.add(name);
        }
      }
    }
  }
  return { mutualTls, types };
};

const convertSecurityList = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!Array.isArray(value)) {
    return deepClone(value);
  }
  const out: unknown[] = [];
  for (const requirement of value) {
    if (!isRecord(requirement)) {
      out.push(deepClone(requirement));
      continue;
    }
    const converted: UnknownRecord = {};
    for (const [name, scopes] of Object.entries(requirement)) {
      if (index.mutualTls.has(name)) {
        continue;
      }
      const type = index.types.get(name);
      const supportsScopes =
        type === undefined || type === "oauth2" || type === "openIdConnect";
      if (!supportsScopes && Array.isArray(scopes) && scopes.length > 0) {
        // 3.0 allows roles only on OAuth-family schemes.
        setKey(converted, name, []);
        continue;
      }
      setKey(converted, name, deepClone(scopes));
    }
    // A requirement that only referenced mutualTLS schemes disappears; an
    // originally empty `{}` (optional security) is kept.
    if (
      Object.keys(requirement).length > 0 &&
      Object.keys(converted).length === 0
    ) {
      continue;
    }
    out.push(converted);
  }
  return out;
};

/**
 * Converts and attaches a `security` list. When mutualTLS removal empties a
 * previously non-empty list, the key is omitted entirely: an explicit empty
 * `security` array means "no security required" and, on an operation, would
 * override the root declaration and silently make the operation public.
 */
const setSecurity = (
  out: UnknownRecord,
  value: unknown,
  index: SecuritySchemeIndex
): void => {
  const converted = convertSecurityList(value, index);
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    Array.isArray(converted) &&
    converted.length === 0
  ) {
    return;
  }
  setKey(out, "security", converted);
};

/** The SPDX `identifier` has no 3.0 equivalent. */
const DROPPED_LICENSE_KEYS = new Set(["identifier"]);

const convertInfo = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "summary": {
        // No `summary` in 3.0.
        continue;
      }
      case "license": {
        setKey(out, "license", omitKeys(item, DROPPED_LICENSE_KEYS));
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

/** Parameter Objects and Header Objects share every field this converter touches. */
const convertParameterOrHeader = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "schema": {
        setKey(out, key, convertSchema(item));
        continue;
      }
      case "content": {
        // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertMediaType via encoding headers
        setKey(out, key, mapRecord(item, convertMediaType));
        continue;
      }
      case "examples": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, deepClone))
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertEncoding = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "headers") {
      setKey(
        out,
        key,
        mapRecord(item, (entry) =>
          convertRefOr(entry, convertParameterOrHeader)
        )
      );
    } else {
      setKey(out, key, deepClone(item));
    }
  }
  return out;
};

const convertMediaType = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "schema": {
        setKey(out, key, convertSchema(item));
        continue;
      }
      case "examples": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, deepClone))
        );
        continue;
      }
      case "encoding": {
        setKey(out, key, mapRecord(item, convertEncoding));
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertRequestBody = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "content") {
      setKey(out, key, mapRecord(item, convertMediaType));
    } else {
      setKey(out, key, deepClone(item));
    }
  }
  return out;
};

const convertResponse = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "headers": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, convertParameterOrHeader)
          )
        );
        continue;
      }
      case "content": {
        setKey(out, key, mapRecord(item, convertMediaType));
        continue;
      }
      case "links": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, deepClone))
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertResponses = (value: unknown): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("x-") ? deepClone(item) : convertRefOr(item, convertResponse)
  );

const convertOperation = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "parameters": {
        setKey(
          out,
          key,
          mapArray(item, (entry) =>
            convertRefOr(entry, convertParameterOrHeader)
          )
        );
        continue;
      }
      case "requestBody": {
        setKey(out, key, convertRefOr(item, convertRequestBody));
        continue;
      }
      case "responses": {
        setKey(out, key, convertResponses(item));
        continue;
      }
      case "callbacks": {
        // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertCallback, as callbacks contain path items
        const convert = convertCallback;
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, (inner) => convert(inner, index))
          )
        );
        continue;
      }
      case "security": {
        setSecurity(out, item, index);
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  if (out.responses === undefined) {
    // Required and non-empty in 3.0, optional in 3.1: a minimal default
    // response keeps the output valid against the official 3.0 schema.
    setKey(out, "responses", { default: { description: "" } });
  }
  return out;
};

const convertCallback = (value: unknown, index: SecuritySchemeIndex): unknown =>
  mapRecord(value, (item, key) =>
    // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertPathItem, as path items contain callbacks
    key.startsWith("x-") ? deepClone(item) : convertPathItem(item, index)
  );

const convertPathItem = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (HTTP_METHODS.has(key)) {
      setKey(out, key, convertOperation(item, index));
      continue;
    }
    switch (key) {
      case "parameters": {
        setKey(
          out,
          key,
          mapArray(item, (entry) =>
            convertRefOr(entry, convertParameterOrHeader)
          )
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertPaths = (value: unknown, index: SecuritySchemeIndex): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("/") ? convertPathItem(item, index) : deepClone(item)
  );

const convertComponents = (
  value: unknown,
  index: SecuritySchemeIndex
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "schemas": {
        setKey(out, key, mapRecord(item, convertSchema));
        continue;
      }
      case "responses": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, convertResponse))
        );
        continue;
      }
      case "parameters":
      case "headers": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, convertParameterOrHeader)
          )
        );
        continue;
      }
      case "examples":
      case "links": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, deepClone))
        );
        continue;
      }
      case "requestBodies": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, convertRequestBody))
        );
        continue;
      }
      case "securitySchemes": {
        const schemes: UnknownRecord = {};
        if (isRecord(item)) {
          for (const [name, scheme] of Object.entries(item)) {
            if (!index.mutualTls.has(name)) {
              setKey(schemes, name, convertRefOr(scheme, deepClone));
            }
          }
          setKey(out, key, schemes);
        } else {
          setKey(out, key, deepClone(item));
        }
        continue;
      }
      case "callbacks": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, (inner) => convertCallback(inner, index))
          )
        );
        continue;
      }
      case "pathItems": {
        // 3.0 has no reusable path items.
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertSpec = (spec: unknown): unknown => {
  if (!isRecord(spec)) {
    return deepClone(spec);
  }
  const index = indexSecuritySchemes(spec);
  const out: UnknownRecord = {};
  for (const [key, value] of Object.entries(spec)) {
    switch (key) {
      case "openapi": {
        setKey(out, "openapi", "3.0.4");
        continue;
      }
      case "jsonSchemaDialect": {
        // 3.0 has no schema-dialect selection.
        continue;
      }
      case "info": {
        setKey(out, "info", convertInfo(value));
        continue;
      }
      case "paths": {
        setKey(out, "paths", convertPaths(value, index));
        continue;
      }
      case "webhooks": {
        // No webhooks in 3.0.
        continue;
      }
      case "components": {
        setKey(out, "components", convertComponents(value, index));
        continue;
      }
      case "security": {
        setSecurity(out, value, index);
        continue;
      }
      default: {
        setKey(out, key, deepClone(value));
      }
    }
  }
  if (out.openapi === undefined) {
    setKey(out, "openapi", "3.0.4");
  }
  if (out.paths === undefined) {
    // Required in 3.0; an empty Paths Object is valid.
    setKey(out, "paths", {});
  }
  return out;
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
