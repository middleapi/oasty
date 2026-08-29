/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/no-runtime-typeof -- the converters are the I/O boundary for untrusted OpenAPI documents: they walk arbitrary input defensively and pass malformed parts through unchanged, so `unknown` values and runtime type checks are the domain contract here */

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
  if (Array.isArray(value)) {
    const existing = seen.get(value);
    if (existing !== undefined) {
      return existing;
    }
    const out: unknown[] = [];
    seen.set(value, out);
    for (const item of value) {
      out.push(cloneValue(item, seen));
    }
    return out;
  }
  if (isRecord(value)) {
    const existing = seen.get(value);
    if (existing !== undefined) {
      return existing;
    }
    const out: UnknownRecord = {};
    seen.set(value, out);
    for (const [key, item] of Object.entries(value)) {
      setKey(out, key, cloneValue(item, seen));
    }
    return out;
  }
  return value;
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
 * Runs `convert` unless `value` is already being converted higher up the
 * call stack — a cyclic reference, which would otherwise recurse forever.
 * The cycling subtree falls back to a cycle-preserving deep clone.
 */
export const withCycleGuard = (
  value: UnknownRecord,
  convert: () => unknown
): unknown => {
  if (converting.has(value)) {
    return deepClone(value);
  }
  converting.add(value);
  try {
    return convert();
  } finally {
    converting.delete(value);
  }
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
 * Returns the `$ref` string of a Reference-Object-shaped value, or
 * `undefined` when the value is not one.
 */
export const getRef = (value: unknown): string | undefined => {
  if (isRecord(value) && typeof value.$ref === "string") {
    return value.$ref;
  }
  return undefined;
};
