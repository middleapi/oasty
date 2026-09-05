/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- the converters are the I/O boundary for untrusted OpenAPI documents: they walk arbitrary input defensively and pass malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Internal helpers shared by the version converters. Everything is defensive:
 * converters never throw on malformed input, they pass unconvertible parts
 * through unchanged.
 */

// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- converters walk arbitrary user-supplied documents whose values are unknown by nature
export type UnknownRecord = Record<string, unknown>;

/**
 * Returned by a converter to remove its entry from the surrounding object or
 * array: the single signal for constructs the target version cannot express.
 */
export const DROP = Symbol("drop");

/**
 * Converts one field of a record. The whole source record is passed along
 * for decisions that depend on sibling fields.
 */
// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- the source is an arbitrary user-supplied object
export type FieldConverter = (item: unknown, source: UnknownRecord) => unknown;

/**
 * What happens to each known field of a record: a converter, or `DROP` to
 * remove the field. Fields not listed (unknown keys, `x-` extensions) are
 * deep-cloned as they are.
 */
// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- the tables are keyed by arbitrary OpenAPI field names
export type FieldTable = Readonly<Record<string, FieldConverter | typeof DROP>>;

export const HTTP_METHODS = [
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
] as const;

/** Field-table entries routing every Operation Object of a Path Item to `convert`. */
export const operationFields = (convert: FieldConverter): FieldTable =>
  Object.fromEntries(HTTP_METHODS.map((method) => [method, convert]));

/**
 * Whether the value is a plain object (the only shape the converters walk
 * into). Arrays, class instances, and primitives are handled by reference or
 * by dedicated array helpers.
 */
export const isRecord = (value: unknown): value is UnknownRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Sets a key on the output record with define-property semantics, so hostile
 * key names like `__proto__` become plain own properties.
 */
export const setKey = (
  target: UnknownRecord,
  key: string,
  value: unknown
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
};

const cloneValue = (
  value: unknown,
  seen: WeakMap<object, unknown>
): unknown => {
  if (!(Array.isArray(value) || isRecord(value))) {
    return value;
  }
  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(value, out);
    for (const item of value) {
      out.push(cloneValue(item, seen));
    }
    return out;
  }
  const out: UnknownRecord = {};
  seen.set(value, out);
  for (const [key, item] of Object.entries(value)) {
    setKey(out, key, cloneValue(item, seen));
  }
  return out;
};

/**
 * A JSON-oriented deep clone that never throws: non-plain values (class
 * instances, functions, ...) are kept by reference, hostile keys like
 * `__proto__` are copied as own data properties instead of being assigned,
 * and cyclic or shared references are preserved in the clone instead of
 * recursing forever.
 */
export const deepClone = <T>(value: T): T => {
  if (!(Array.isArray(value) || isRecord(value))) {
    return value;
  }
  // SAFETY: cloneValue preserves the runtime shape of its input.
  return cloneValue(value, new WeakMap()) as T;
};

/** Objects currently being converted somewhere up the call stack. */
const converting = new WeakSet<object>();

/**
 * Rebuilds a plain object field by field: each key goes through its entry in
 * `fields` (or is deep-cloned when it has none), entries mapped to or
 * returning `DROP` are left out, and `finish` receives the result together
 * with the source for fix-ups that depend on several fields. Non-object input
 * is deep-cloned unchanged, and so is an object already being converted
 * higher up the call stack: a cyclic reference, which would otherwise recurse
 * forever.
 */
export const convertRecord = (
  value: unknown,
  fields: FieldTable,
  finish?: (out: UnknownRecord, source: UnknownRecord) => unknown
): unknown => {
  if (!isRecord(value) || converting.has(value)) {
    return deepClone(value);
  }
  converting.add(value);
  try {
    const out: UnknownRecord = {};
    for (const [key, item] of Object.entries(value)) {
      const convert = Object.hasOwn(fields, key) ? fields[key] : undefined;
      if (convert === DROP) {
        continue;
      }
      const converted =
        convert === undefined ? deepClone(item) : convert(item, value);
      if (converted !== DROP) {
        setKey(out, key, converted);
      }
    }
    return finish === undefined ? out : finish(out, value);
  } finally {
    converting.delete(value);
  }
};

/**
 * Applies `convert` to every value of a plain object, preserving key order
 * and leaving out entries it turns into `DROP`. Non-object input is
 * deep-cloned unchanged.
 */
export const mapRecord = (
  value: unknown,
  convert: (item: unknown, key: string) => unknown
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  const out: UnknownRecord = {};
  for (const [key, item] of Object.entries(value)) {
    const converted = convert(item, key);
    if (converted !== DROP) {
      setKey(out, key, converted);
    }
  }
  return out;
};

/**
 * Applies `convert` to every element of an array, leaving out elements it
 * turns into `DROP`. Non-array input is deep-cloned unchanged.
 */
export const mapArray = (
  value: unknown,
  convert: (item: unknown) => unknown
): unknown => {
  if (!Array.isArray(value)) {
    return deepClone(value);
  }
  return value.map((item) => convert(item)).filter((item) => item !== DROP);
};

/**
 * Returns the `$ref` string of a Reference-Object-shaped value, or
 * `undefined` when the value is not one.
 */
export const getRef = (value: unknown): string | undefined => {
  if (isRecord(value) && typeof value.$ref === "string") {
    return value.$ref;
  }
  return undefined;
};
