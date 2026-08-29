/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- this converter is the I/O boundary for untrusted OpenAPI documents: it walks arbitrary input defensively and passes malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Converts OpenAPI 3.2 documents and schemas to OpenAPI 3.1 (targeting the
 * latest patch release, 3.1.2).
 *
 * The conversion never throws: parts that do not match the expected shape are
 * deep-copied through unchanged, and existing specification extensions
 * (`x-` keys) as well as unknown keys are always preserved. Constructs 3.1
 * cannot express are converted where an equivalent exists and removed
 * otherwise — the converter never invents `x-` keys of its own:
 *
 * - Removed: `$self`, server `name`, tag `summary`/`parent`/`kind`, the
 *   `query` operation and `additionalOperations` of Path Items,
 *   `in: "querystring"` parameters (from parameter lists and
 *   `components.parameters`), `style: "cookie"` (the 3.1 default `form`
 *   applies), media type and encoding `prefixEncoding`/`itemEncoding` and
 *   nested `encoding`, OAuth `deviceAuthorization` flows, and security
 *   scheme `oauth2MetadataUrl` and `deprecated`.
 * - Converted: reusable `components.mediaTypes` are inlined at their `$ref`
 *   use sites (3.1 content maps allow no references) and the map itself is
 *   removed; media type `itemSchema` becomes
 *   `schema: { type: "array", items }` when no `schema` exists (the 3.2
 *   sequential media type data model) and is removed otherwise; example
 *   `dataValue`/`serializedValue` fill a free `value` slot (in that order);
 *   response `summary` becomes the `description` when none exists (3.1
 *   requires one, so `""` is synthesized as a last resort).
 * - Schema Objects pass through unchanged: 3.2 keeps the exact 3.1 schema
 *   dialect, and JSON Schema allows arbitrary extra keywords, so the
 *   3.2-only OAS vocabulary fields (discriminator `defaultMapping`, XML
 *   `nodeType`) are legal to keep as-is.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html}
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html}
 */

import type { OpenAPIV3_1, OpenAPIV3_2 } from "@oasty/types";

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

const MEDIA_TYPES_REF_PREFIX = "#/components/mediaTypes/";

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

/** How many chained `components.mediaTypes` references to follow. */
const MAX_MEDIA_TYPE_REF_DEPTH = 32;

/** 3.2-only fields with no 3.1 equivalent, removed per object. */
const DROPPED_SERVER_KEYS = new Set(["name"]);
const DROPPED_TAG_KEYS = new Set(["kind", "parent", "summary"]);
const DROPPED_FLOWS_KEYS = new Set(["deviceAuthorization"]);

interface Context {
  /** How deep the current media type resolution has recursed. */
  depth: number;
  /** The raw `components.mediaTypes` map, used to inline references. */
  mediaTypes: UnknownRecord | undefined;
}

const parseMediaTypeName = (ref: string): string | undefined => {
  if (!ref.startsWith(MEDIA_TYPES_REF_PREFIX)) {
    return undefined;
  }
  const name = ref.slice(MEDIA_TYPES_REF_PREFIX.length);
  if (name === "" || name.includes("/")) {
    return undefined;
  }
  return name;
};

/**
 * Converts an OpenAPI 3.2 Schema Object to its OpenAPI 3.1 form: a deep
 * clone. 3.2 keeps the exact 3.1 schema dialect, and JSON Schema allows
 * arbitrary extra keywords without an `x-` prefix, so even the 3.2-only OAS
 * vocabulary fields (discriminator `defaultMapping`, XML `nodeType`) are
 * legal to keep as-is.
 */
export const downgradeSchemaV32ToV31 = <T = unknown>(
  schema: OpenAPIV3_2.SchemaObject<T>
): OpenAPIV3_1.SchemaObject<T> => {
  const converted: unknown = deepClone(schema);
  // SAFETY: every 3.2 Schema Object is already a structurally valid 3.1 one.
  return converted as OpenAPIV3_1.SchemaObject<T>;
};

const convertServer = (value: unknown): unknown =>
  omitKeys(value, DROPPED_SERVER_KEYS);

const convertExample = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key !== "dataValue" && key !== "serializedValue") {
      setKey(out, key, deepClone(item));
    }
  }
  // 3.2's dataValue/serializedValue fill 3.1's `value` slot when it is free
  // (and no externalValue competes); whatever cannot be promoted is removed.
  if (!("value" in value) && !("externalValue" in value)) {
    if ("dataValue" in value) {
      setKey(out, "value", deepClone(value.dataValue));
    } else if ("serializedValue" in value) {
      setKey(out, "value", deepClone(value.serializedValue));
    }
  }
  return out;
};

const convertLink = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "server") {
      setKey(out, key, convertServer(item));
    } else {
      setKey(out, key, deepClone(item));
    }
  }
  return out;
};

const convertSecurityScheme = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      // New in 3.2, no 3.1 equivalent.
      case "deprecated":
      case "oauth2MetadataUrl": {
        continue;
      }
      case "flows": {
        setKey(out, key, omitKeys(item, DROPPED_FLOWS_KEYS));
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

/**
 * References stay references in 3.1 (including their `summary`/`description`
 * overrides); everything else is converted. Converters that ignore the
 * context are wrapped so every call site reads uniformly.
 */
const convertRefOr = (
  value: unknown,
  context: Context,
  convert: (item: unknown, innerContext: Context) => unknown
): unknown => {
  if (getRef(value) !== undefined) {
    return deepClone(value);
  }
  return convert(value, context);
};

/** Whether a parameter uses the 3.2-only `querystring` location. */
const isQuerystringParameter = (value: unknown): boolean =>
  isRecord(value) && value.in === "querystring";

/** Parameter Objects and Header Objects share every field this converter touches. */
const convertParameterOrHeader = (
  value: unknown,
  context: Context
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "style": {
        // "cookie" is not a 3.1 style; removing it lets the 3.1 default
        // (`form`) take over. Other styles pass through.
        if (item !== "cookie") {
          setKey(out, key, deepClone(item));
        }
        continue;
      }
      case "allowReserved": {
        // 3.2 broadened allowReserved beyond query parameters; 3.1 only
        // defines it there.
        if (!("in" in value) || value.in === "query") {
          setKey(out, key, deepClone(item));
        }
        continue;
      }
      case "content": {
        // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertContentMap via media type encodings
        setKey(out, key, convertContentMap(item, context));
        continue;
      }
      case "examples": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertExample)
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

/** Converts a parameter list, removing 3.2-only `querystring` parameters. */
const convertParameterList = (value: unknown, context: Context): unknown => {
  if (!Array.isArray(value)) {
    return deepClone(value);
  }
  return value
    .filter((item) => !isQuerystringParameter(item))
    .map((item) => convertRefOr(item, context, convertParameterOrHeader));
};

const convertEncoding = (value: unknown, context: Context): unknown => {
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
            convertRefOr(entry, context, convertParameterOrHeader)
          )
        );
        continue;
      }
      // Nested and positional encoding are new in 3.2.
      case "encoding":
      case "itemEncoding":
      case "prefixEncoding": {
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertMediaType = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      // `itemSchema` is handled below; `description`, positional encoding,
      // and nested encoding are 3.2-only.
      case "description":
      case "itemEncoding":
      case "itemSchema":
      case "prefixEncoding": {
        continue;
      }
      case "encoding": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertEncoding(entry, context))
        );
        continue;
      }
      case "examples": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertExample)
          )
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  if ("itemSchema" in value && out.schema === undefined) {
    // The 3.2 sequential media type data model maps streams to arrays.
    setKey(out, "schema", {
      items: deepClone(value.itemSchema),
      type: "array",
    });
  }
  return out;
};

const resolveContentEntry = (value: unknown, context: Context): unknown => {
  const ref = getRef(value);
  if (ref === undefined) {
    return convertMediaType(value, context);
  }
  const name = parseMediaTypeName(ref);
  if (
    name === undefined ||
    context.mediaTypes === undefined ||
    !(name in context.mediaTypes) ||
    context.depth >= MAX_MEDIA_TYPE_REF_DEPTH
  ) {
    // External, unknown, or cyclic target: keep the reference as-is.
    return deepClone(value);
  }
  context.depth += 1;
  const resolved = resolveContentEntry(context.mediaTypes[name], context);
  context.depth -= 1;
  return resolved;
};

/**
 * Converts a content map, inlining `components.mediaTypes` references: 3.1
 * content maps hold Media Type Objects only, never references.
 */
const convertContentMap = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item) => resolveContentEntry(item, context));

const convertRequestBody = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "content") {
      setKey(out, key, convertContentMap(item, context));
    } else {
      setKey(out, key, deepClone(item));
    }
  }
  return out;
};

const convertResponse = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "summary": {
        // Promoted below when possible; 3.1 responses have no summary.
        continue;
      }
      case "headers": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertParameterOrHeader)
          )
        );
        continue;
      }
      case "content": {
        setKey(out, key, convertContentMap(item, context));
        continue;
      }
      case "links": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, context, convertLink))
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  if ("summary" in value && !("description" in value)) {
    setKey(out, "description", deepClone(value.summary));
  }
  if (out.description === undefined) {
    // Required in 3.1, optional in 3.2.
    setKey(out, "description", "");
  }
  return out;
};

const convertResponses = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("x-")
      ? deepClone(item)
      : convertRefOr(item, context, convertResponse)
  );

const convertOperation = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "parameters": {
        setKey(out, key, convertParameterList(item, context));
        continue;
      }
      case "requestBody": {
        setKey(out, key, convertRefOr(item, context, convertRequestBody));
        continue;
      }
      case "responses": {
        setKey(out, key, convertResponses(item, context));
        continue;
      }
      case "callbacks": {
        // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertCallback, as callbacks contain path items
        const convert = convertCallback;
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, context, convert))
        );
        continue;
      }
      case "servers": {
        setKey(out, key, mapArray(item, convertServer));
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertCallback = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    // oxlint-disable-next-line no-use-before-define -- mutually recursive with convertPathItem, as path items contain callbacks
    key.startsWith("x-") ? deepClone(item) : convertPathItem(item, context)
  );

const convertPathItem = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (HTTP_METHODS.has(key)) {
      setKey(out, key, convertOperation(item, context));
      continue;
    }
    switch (key) {
      // The QUERY method and arbitrary additional operations are 3.2-only.
      case "additionalOperations":
      case "query": {
        continue;
      }
      case "parameters": {
        setKey(out, key, convertParameterList(item, context));
        continue;
      }
      case "servers": {
        setKey(out, key, mapArray(item, convertServer));
        continue;
      }
      default: {
        setKey(out, key, deepClone(item));
      }
    }
  }
  return out;
};

const convertPaths = (value: unknown, context: Context): unknown =>
  mapRecord(value, (item, key) =>
    key.startsWith("/") ? convertPathItem(item, context) : deepClone(item)
  );

/** Converts `components.parameters`, removing `querystring` parameters. */
const convertParameterComponents = (
  value: unknown,
  context: Context
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [name, item] of Object.entries(value)) {
    if (!isQuerystringParameter(item)) {
      setKey(out, name, convertRefOr(item, context, convertParameterOrHeader));
    }
  }
  return out;
};

const convertComponents = (value: unknown, context: Context): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    switch (key) {
      case "responses": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertResponse)
          )
        );
        continue;
      }
      case "parameters": {
        setKey(out, key, convertParameterComponents(item, context));
        continue;
      }
      case "headers": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertParameterOrHeader)
          )
        );
        continue;
      }
      case "examples": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertExample)
          )
        );
        continue;
      }
      case "requestBodies": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertRequestBody)
          )
        );
        continue;
      }
      case "mediaTypes": {
        // Inlined at use sites; 3.1 has no reusable media types.
        continue;
      }
      case "securitySchemes": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertSecurityScheme)
          )
        );
        continue;
      }
      case "links": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertRefOr(entry, context, convertLink))
        );
        continue;
      }
      case "callbacks": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) =>
            convertRefOr(entry, context, convertCallback)
          )
        );
        continue;
      }
      case "pathItems": {
        setKey(
          out,
          key,
          mapRecord(item, (entry) => convertPathItem(entry, context))
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

const convertSpec = (spec: unknown): unknown => {
  if (!isRecord(spec)) {
    return deepClone(spec);
  }
  const { components } = spec;
  const mediaTypes =
    isRecord(components) && isRecord(components.mediaTypes)
      ? components.mediaTypes
      : undefined;
  const context: Context = { depth: 0, mediaTypes };
  const out: UnknownRecord = {};
  for (const [key, value] of Object.entries(spec)) {
    switch (key) {
      case "openapi": {
        setKey(out, "openapi", "3.1.2");
        continue;
      }
      case "$self": {
        // 3.1 has no self-assigned document URI.
        continue;
      }
      case "servers": {
        setKey(out, key, mapArray(value, convertServer));
        continue;
      }
      case "paths": {
        setKey(out, key, convertPaths(value, context));
        continue;
      }
      case "webhooks": {
        setKey(
          out,
          key,
          mapRecord(value, (item) => convertPathItem(item, context))
        );
        continue;
      }
      case "components": {
        setKey(out, key, convertComponents(value, context));
        continue;
      }
      case "tags": {
        setKey(
          out,
          key,
          mapArray(value, (item) => omitKeys(item, DROPPED_TAG_KEYS))
        );
        continue;
      }
      default: {
        setKey(out, key, deepClone(value));
      }
    }
  }
  if (out.openapi === undefined) {
    setKey(out, "openapi", "3.1.2");
  }
  return out;
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
