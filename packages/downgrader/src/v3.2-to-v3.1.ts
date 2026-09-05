/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- this converter is the I/O boundary for untrusted OpenAPI documents: it walks arbitrary input defensively and passes malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Converts OpenAPI 3.2 documents and schemas to OpenAPI 3.1 (targeting the
 * latest patch release, 3.1.2).
 *
 * The conversion never throws: parts that do not match the expected shape
 * are deep-copied through unchanged, a subtree that cycles back into an
 * ancestor object is deep-copied with its cycle preserved instead of
 * converted, and existing specification extensions (`x-` keys) as well as
 * unknown keys are always preserved. Constructs 3.1 cannot express are
 * converted where an equivalent exists and removed otherwise — the converter
 * never invents `x-` keys of its own:
 *
 * - Removed: `$self`, server `name`, tag `summary`/`parent`/`kind`, the
 *   `query` operation and `additionalOperations` of Path Items,
 *   `in: "querystring"` parameters (from parameter lists and
 *   `components.parameters`, following chains of reference aliases),
 *   `style: "cookie"` (the 3.1 default `form` applies), media type and
 *   encoding `prefixEncoding`/`itemEncoding` and nested `encoding`, OAuth
 *   `deviceAuthorization` flows, and security scheme `oauth2MetadataUrl`
 *   and `deprecated`.
 * - Converted: reusable `components.mediaTypes` are inlined at their `$ref`
 *   use sites (3.1 content maps allow no references) and the map itself is
 *   removed; content entries whose reference cannot be inlined are removed,
 *   and a parameter or header losing its entire `content` that way is
 *   removed with it (3.1 requires exactly one entry there); media type
 *   `itemSchema` becomes `schema: { type: "array", items }` when no
 *   `schema` exists (the 3.2 sequential media type data model) and is
 *   removed otherwise; example `dataValue`/`serializedValue` fill a free
 *   `value` slot (in that order); response `summary` becomes the
 *   `description` when none exists (3.1 requires one, so `""` is
 *   synthesized as a last resort).
 * - Schema Objects pass through unchanged: the 3.2 Schema Object keyword
 *   set is identical to 3.1's (3.2 defines its own dialect URI, but only
 *   the OAS base vocabulary gained fields), so the 3.2-only fields
 *   (discriminator `defaultMapping`, XML `nodeType`) are deliberately
 *   retained. The standard 3.1 document schema tolerates them, but the
 *   strict OAS base-vocabulary meta-schema closes the XML and
 *   Discriminator Objects to `x-` extras, and 3.1 tooling will not act on
 *   them; `nodeType` is recovered on the 3.1-to-3.0 hop.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html}
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html}
 */

import type { OpenAPIV3_1, OpenAPIV3_2 } from "@oasty/types";

import type { FieldConverter, UnknownRecord } from "./shared";
import {
  convertRecord,
  deepClone,
  DROP,
  getRef,
  isRecord,
  mapArray,
  mapRecord,
  operationFields,
} from "./shared";

const HEADERS_REF_PREFIX = "#/components/headers/";
const MEDIA_TYPES_REF_PREFIX = "#/components/mediaTypes/";
const PARAMETERS_REF_PREFIX = "#/components/parameters/";

interface Context {
  /** The raw `components.mediaTypes` map, used to inline references. */
  mediaTypes: UnknownRecord | undefined;
  /** `$ref` strings of `components.headers` entries conversion removes. */
  removedHeaderRefs: ReadonlySet<string>;
  /** `$ref` strings of `components.parameters` entries conversion removes. */
  removedParameterRefs: ReadonlySet<string>;
}

/**
 * Converts an OpenAPI 3.2 Schema Object to its OpenAPI 3.1 form: a deep
 * clone. The 3.2 Schema Object keyword set is identical to 3.1's (3.2
 * defines its own dialect URI, but only the OAS base vocabulary gained
 * fields), so the 3.2-only fields (discriminator `defaultMapping`, XML
 * `nodeType`) are deliberately retained. The standard 3.1 document schema
 * tolerates them; the strict OAS base-vocabulary meta-schema closes the
 * XML and Discriminator Objects to `x-` extras, and 3.1 tooling will not
 * act on them.
 */
export const downgradeSchemaV32ToV31 = <T = unknown>(
  schema: OpenAPIV3_2.SchemaObject<T>
): OpenAPIV3_1.SchemaObject<T> => {
  const converted: unknown = deepClone(schema);
  // SAFETY: every 3.2 Schema Object is already a structurally valid 3.1 one.
  return converted as OpenAPIV3_1.SchemaObject<T>;
};

/**
 * References stay references in 3.1 (including their `summary`/`description`
 * overrides); everything else is converted.
 */
const convertRefOr = (
  value: unknown,
  context: Context,
  convert: (item: unknown, innerContext: Context) => unknown
): unknown =>
  getRef(value) === undefined ? convert(value, context) : deepClone(value);

/** Field converter for a map of reference-or-object entries. */
const refMap =
  (
    context: Context,
    convert: (item: unknown, innerContext: Context) => unknown
  ): FieldConverter =>
  (item) =>
    mapRecord(item, (entry) => convertRefOr(entry, context, convert));

const convertServer = (value: unknown): unknown =>
  convertRecord(value, { name: DROP });

const convertTag = (value: unknown): unknown =>
  convertRecord(value, { kind: DROP, parent: DROP, summary: DROP });

const convertLink = (value: unknown): unknown =>
  convertRecord(value, { server: convertServer });

const convertSecurityScheme = (value: unknown): unknown =>
  convertRecord(value, {
    // `deprecated`, `oauth2MetadataUrl`, and the device authorization flow
    // are new in 3.2.
    deprecated: DROP,
    flows: (item) => convertRecord(item, { deviceAuthorization: DROP }),
    oauth2MetadataUrl: DROP,
  });

const convertExample = (value: unknown): unknown =>
  convertRecord(
    value,
    { dataValue: DROP, serializedValue: DROP },
    (out, example) => {
      // 3.2's dataValue/serializedValue fill 3.1's `value` slot when it is
      // free (and no externalValue competes); whatever cannot be promoted is
      // removed.
      if ("value" in example || "externalValue" in example) {
        return out;
      }
      if ("dataValue" in example) {
        out.value = deepClone(example.dataValue);
      } else if ("serializedValue" in example) {
        out.value = deepClone(example.serializedValue);
      }
      return out;
    }
  );

/** Whether a parameter uses the 3.2-only `querystring` location. */
const isQuerystringParameter = (value: unknown): boolean =>
  isRecord(value) && value.in === "querystring";

/** Whether the value references a component entry conversion removes. */
const isRemovedRef = (
  value: unknown,
  removed: ReadonlySet<string>
): boolean => {
  const ref = getRef(value);
  return ref !== undefined && removed.has(ref);
};

/** Parameter Objects and Header Objects share every field this converter touches. */
const convertParameterOrHeader = (value: unknown, context: Context): unknown =>
  convertRecord(
    value,
    {
      // 3.2 broadened allowReserved beyond query parameters; 3.1 only
      // defines it there.
      allowReserved: (item, parameter) =>
        !("in" in parameter) || parameter.in === "query"
          ? deepClone(item)
          : DROP,
      // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertContentMap via media type encodings
      content: (item) => convertContentMap(item, context),
      examples: refMap(context, convertExample),
      // "cookie" is not a 3.1 style; removing it lets the 3.1 default
      // (`form`) take over. Other styles pass through.
      style: (item) => (item === "cookie" ? DROP : deepClone(item)),
    },
    (out, parameter) => {
      const lostContent =
        isRecord(parameter.content) &&
        Object.keys(parameter.content).length > 0 &&
        isRecord(out.content) &&
        Object.keys(out.content).length === 0;
      // 3.1 requires exactly one content entry on parameters and headers, so
      // one whose entire content could not be inlined is removed.
      return lostContent ? DROP : out;
    }
  );

/**
 * Converts a parameter list entry, removing 3.2-only `querystring`
 * parameters and references to removed component parameters.
 */
const convertParameterEntry = (value: unknown, context: Context): unknown =>
  isQuerystringParameter(value) ||
  isRemovedRef(value, context.removedParameterRefs)
    ? DROP
    : convertRefOr(value, context, convertParameterOrHeader);

const convertParameterList = (value: unknown, context: Context): unknown =>
  mapArray(value, (item) => convertParameterEntry(item, context));

const convertHeaderMap = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item) =>
    isRemovedRef(item, context.removedHeaderRefs)
      ? DROP
      : convertRefOr(item, context, convertParameterOrHeader)
  );

const convertEncoding = (value: unknown, context: Context): unknown =>
  convertRecord(value, {
    // Nested and positional encoding are new in 3.2.
    encoding: DROP,
    headers: (item) => convertHeaderMap(item, context),
    itemEncoding: DROP,
    prefixEncoding: DROP,
  });

const convertMediaType = (value: unknown, context: Context): unknown =>
  convertRecord(
    value,
    {
      // `description`, positional encoding, and nested encoding are
      // 3.2-only; `itemSchema` is recovered below.
      description: DROP,
      encoding: (item) =>
        mapRecord(item, (entry) => convertEncoding(entry, context)),
      examples: refMap(context, convertExample),
      itemEncoding: DROP,
      itemSchema: DROP,
      prefixEncoding: DROP,
    },
    (out, mediaType) => {
      if ("itemSchema" in mediaType && out.schema === undefined) {
        // The 3.2 sequential media type data model maps streams to arrays.
        out.schema = { items: deepClone(mediaType.itemSchema), type: "array" };
      }
      return out;
    }
  );

/**
 * Follows a content-map entry's `components.mediaTypes` reference chain to
 * the Media Type Object it names (non-reference entries stand for
 * themselves), or to `DROP` when it cannot be inlined: an external, unknown,
 * or cyclic target.
 */
const resolveMediaType = (
  value: unknown,
  mediaTypes: UnknownRecord | undefined,
  seen: Set<string>
): unknown => {
  const ref = getRef(value);
  if (ref === undefined) {
    return value;
  }
  if (!ref.startsWith(MEDIA_TYPES_REF_PREFIX)) {
    return DROP;
  }
  const name = ref.slice(MEDIA_TYPES_REF_PREFIX.length);
  if (
    name === "" ||
    name.includes("/") ||
    mediaTypes === undefined ||
    !Object.hasOwn(mediaTypes, name) ||
    seen.has(name)
  ) {
    return DROP;
  }
  seen.add(name);
  return resolveMediaType(mediaTypes[name], mediaTypes, seen);
};

/**
 * Converts a content map, inlining `components.mediaTypes` references (3.1
 * content maps hold Media Type Objects only, never references) and removing
 * entries whose reference cannot be inlined.
 */
const convertContentMap = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item) => {
    const target = resolveMediaType(item, context.mediaTypes, new Set());
    return target === DROP ? DROP : convertMediaType(target, context);
  });

const convertRequestBody = (value: unknown, context: Context): unknown =>
  convertRecord(value, { content: (item) => convertContentMap(item, context) });

const convertResponse = (value: unknown, context: Context): unknown =>
  convertRecord(
    value,
    {
      content: (item) => convertContentMap(item, context),
      headers: (item) => convertHeaderMap(item, context),
      links: refMap(context, convertLink),
      summary: DROP,
    },
    (out, response) => {
      if (out.description === undefined) {
        // Required in 3.1, optional in 3.2: the 3.2 summary stands in, and
        // `""` is synthesized as a last resort.
        out.description =
          "summary" in response ? deepClone(response.summary) : "";
      }
      return out;
    }
  );

const convertResponses = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("x-")
      ? deepClone(item)
      : convertRefOr(item, context, convertResponse)
  );

const convertOperation = (value: unknown, context: Context): unknown =>
  convertRecord(value, {
    // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertCallback, as callbacks contain path items
    callbacks: refMap(context, convertCallback),
    parameters: (item) => convertParameterList(item, context),
    requestBody: (item) => convertRefOr(item, context, convertRequestBody),
    responses: (item) => convertResponses(item, context),
    servers: (item) => mapArray(item, convertServer),
  });

const convertCallback = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertPathItem, as path items contain callbacks
    key.startsWith("x-") ? deepClone(item) : convertPathItem(item, context)
  );

const convertPathItem = (value: unknown, context: Context): unknown =>
  convertRecord(value, {
    ...operationFields((item) => convertOperation(item, context)),
    // The QUERY method and arbitrary additional operations are 3.2-only.
    additionalOperations: DROP,
    parameters: (item) => convertParameterList(item, context),
    query: DROP,
    servers: (item) => mapArray(item, convertServer),
  });

const convertPaths = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("/") ? convertPathItem(item, context) : deepClone(item)
  );

const convertComponents = (value: unknown, context: Context): unknown =>
  convertRecord(value, {
    callbacks: refMap(context, convertCallback),
    examples: refMap(context, convertExample),
    headers: (item) => convertHeaderMap(item, context),
    links: refMap(context, convertLink),
    // Inlined at use sites; 3.1 has no reusable media types.
    mediaTypes: DROP,
    parameters: (item) =>
      mapRecord(item, (entry) => convertParameterEntry(entry, context)),
    pathItems: (item) =>
      mapRecord(item, (entry) => convertPathItem(entry, context)),
    requestBodies: refMap(context, convertRequestBody),
    responses: refMap(context, convertResponse),
    securitySchemes: refMap(context, convertSecurityScheme),
  });

/** Whether conversion would remove every entry of the value's `content`. */
const losesEntireContent = (
  value: unknown,
  mediaTypes: UnknownRecord | undefined
): boolean => {
  if (!(isRecord(value) && isRecord(value.content))) {
    return false;
  }
  const entries = Object.values(value.content);
  return (
    entries.length > 0 &&
    entries.every(
      (item) => resolveMediaType(item, mediaTypes, new Set()) === DROP
    )
  );
};

/**
 * Collects the `$ref` strings of component entries conversion removes
 * (querystring parameters, and parameters or headers losing their entire
 * `content`), iterated to a fixpoint so chains of reference aliases are
 * removed with their targets.
 */
const indexRemovedComponentRefs = (
  map: unknown,
  prefix: string,
  mediaTypes: UnknownRecord | undefined,
  isDirectlyRemoved: (item: unknown) => boolean
): Set<string> => {
  const removed = new Set<string>();
  if (!isRecord(map)) {
    return removed;
  }
  const entries = Object.entries(map);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, item] of entries) {
      const selfRef = prefix + name;
      if (removed.has(selfRef)) {
        continue;
      }
      const target = getRef(item);
      if (
        isDirectlyRemoved(item) ||
        losesEntireContent(item, mediaTypes) ||
        (target !== undefined && removed.has(target))
      ) {
        removed.add(selfRef);
        changed = true;
      }
    }
  }
  return removed;
};

const createContext = (spec: unknown): Context => {
  const components = isRecord(spec) ? spec.components : undefined;
  const mediaTypes =
    isRecord(components) && isRecord(components.mediaTypes)
      ? components.mediaTypes
      : undefined;
  return {
    mediaTypes,
    removedHeaderRefs: indexRemovedComponentRefs(
      isRecord(components) ? components.headers : undefined,
      HEADERS_REF_PREFIX,
      mediaTypes,
      () => false
    ),
    removedParameterRefs: indexRemovedComponentRefs(
      isRecord(components) ? components.parameters : undefined,
      PARAMETERS_REF_PREFIX,
      mediaTypes,
      isQuerystringParameter
    ),
  };
};

const convertSpec = (spec: unknown): unknown => {
  const context = createContext(spec);
  return convertRecord(
    spec,
    {
      // 3.1 has no self-assigned document URI.
      $self: DROP,
      components: (item) => convertComponents(item, context),
      paths: (item) => convertPaths(item, context),
      servers: (item) => mapArray(item, convertServer),
      tags: (item) => mapArray(item, convertTag),
      webhooks: (item) =>
        mapRecord(item, (entry) => convertPathItem(entry, context)),
    },
    (out) => {
      out.openapi = "3.1.2";
      return out;
    }
  );
};

/**
 * Converts an OpenAPI 3.2 document to OpenAPI 3.1.2. The input is never
 * mutated, unknown keys and existing specification extensions are preserved,
 * and malformed parts are copied through unchanged instead of throwing.
 */
export const downgradeSpecV32ToV31 = (
  spec: OpenAPIV3_2.OpenAPIObject
): OpenAPIV3_1.OpenAPIObject => {
  const converted: unknown = convertSpec(spec);
  // SAFETY: convertSpec rewrites every 3.2-only construct into its 3.1 form.
  return converted as OpenAPIV3_1.OpenAPIObject;
};
