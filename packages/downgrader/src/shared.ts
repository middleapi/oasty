/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-runtime-typeof -- the converters are the I/O boundary for untrusted OpenAPI documents: they walk arbitrary input defensively and pass malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

/**
 * Internal helpers shared by the version converters. Everything is defensive:
 * converters never throw on malformed input, they pass unconvertible parts
 * through unchanged.
 */

// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- converters walk arbitrary user-supplied documents whose values are unknown by nature
export type UnknownRecord = Record<string, unknown>;

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
 * A JSON-oriented deep clone that never throws: non-plain values (class
 * instances, functions, ...) are kept by reference, and hostile keys like
 * `__proto__` are copied as own data properties instead of being assigned.
 */
export const deepClone = <T>(value: T): T => {
  if (Array.isArray(value)) {
    // SAFETY: mapping an array element-wise preserves its runtime shape.
    return value.map((item) => deepClone(item)) as T;
  }
  if (isRecord(value)) {
    // SAFETY: rebuilding a plain object entry-wise preserves its runtime shape.
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepClone(item)])
    ) as T;
  }
  return value;
};

/**
 * Applies `convert` to every value of a plain object, preserving key order.
 * Non-object input is deep-cloned unchanged.
 */
export const mapRecord = (
  value: unknown,
  convert: (item: unknown, key: string) => unknown
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, convert(item, key)])
  );
};

/**
 * Applies `convert` to every element of an array. Non-array input is
 * deep-cloned unchanged.
 */
export const mapArray = (
  value: unknown,
  convert: (item: unknown) => unknown
): unknown => {
  if (!Array.isArray(value)) {
    return deepClone(value);
  }
  return value.map((item) => convert(item));
};

/**
 * Deep-clones a plain object without the given keys, the building block for
 * removing fields the target version cannot express. Non-object input is
 * deep-cloned unchanged.
 */
export const omitKeys = (
  value: unknown,
  keys: ReadonlySet<string>
): unknown => {
  if (!isRecord(value)) {
    return deepClone(value);
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !keys.has(key))
      .map(([key, item]) => [key, deepClone(item)])
  );
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
