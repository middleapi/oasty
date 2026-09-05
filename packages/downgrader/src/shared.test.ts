/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns -- the helpers under test are the converters' `unknown`-typed I/O boundary, so the test doubles mirror their signatures */

import type { UnknownRecord } from "./shared";
import {
  convertRecord,
  deepClone,
  DROP,
  getRef,
  HTTP_METHODS,
  isRecord,
  mapArray,
  mapRecord,
  operationFields,
  setKey,
} from "./shared";

const identity = <T>(value: T): T => value;

const asRecord = (value: unknown): UnknownRecord =>
  // SAFETY: the helpers return plain objects for plain-object input; the tests inspect their keys.
  value as UnknownRecord;

/** A converter that recurses into `self`, so a self-referencing node re-enters convertRecord. */
const convertNode = (value: unknown): unknown =>
  convertRecord(value, {
    name: () => "converted",
    self: (item) => convertNode(item),
  });

describe("isRecord", () => {
  it("returns true for plain object literals", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("returns true for objects with a null prototype", () => {
    expect(isRecord(Object.create(null))).toBe(true);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("text")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(Symbol("s"))).toBe(false);
    expect(isRecord(10n)).toBe(false);
  });

  it("returns false for class instances", () => {
    expect(isRecord(new Date())).toBe(false);
    expect(isRecord(new Map())).toBe(false);
  });
});

describe("deepClone", () => {
  it("deep-copies nested plain objects and arrays without sharing references", () => {
    const input = {
      list: [{ deep: { value: 1 } }, [2, 3]],
      nested: { inner: { leaf: "x" } },
    };
    const clone = deepClone(input);
    expect(clone).toEqual(input);
    expect(clone).not.toBe(input);
    expect(clone.list).not.toBe(input.list);
    expect(clone.list[0]).not.toBe(input.list[0]);
    expect(clone.list[1]).not.toBe(input.list[1]);
    expect(clone.nested).not.toBe(input.nested);
    expect(clone.nested.inner).not.toBe(input.nested.inner);
  });

  it("keeps functions and class instances by reference", () => {
    const date = new Date();
    const map = new Map<string, number>();
    const clone = deepClone({ date, fn: identity, map });
    expect(clone.fn).toBe(identity);
    expect(clone.date).toBe(date);
    expect(clone.map).toBe(map);
  });

  it("returns primitives as-is", () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone("a")).toBe("a");
    expect(deepClone(null)).toBe(null);
    expect(deepClone(true)).toBe(true);
  });

  it("copies a hostile __proto__ own key as a plain own data property without prototype pollution", () => {
    const input: unknown = JSON.parse('{"__proto__": {"polluted": true}}');
    const clone = asRecord(deepClone(input));
    expect(Object.getOwnPropertyNames(clone)).toContain("__proto__");
    expect(Object.getOwnPropertyDescriptor(clone, "__proto__")?.value).toEqual({
      polluted: true,
    });
    expect(Object.getPrototypeOf(clone)).toBe(Object.prototype);
    expect(asRecord({}).polluted).toBeUndefined();
  });

  it("preserves key order", () => {
    const input: UnknownRecord = {};
    input.zebra = 1;
    input.apple = 2;
    input.mango = 3;
    expect(Object.keys(deepClone(input))).toEqual(["zebra", "apple", "mango"]);
  });

  it("preserves object cycles instead of recursing forever", () => {
    const child: UnknownRecord = {};
    const node: UnknownRecord = { child, name: "root" };
    child.parent = node;
    const clone = deepClone(node);
    expect(clone).not.toBe(node);
    expect(clone.name).toBe("root");
    expect(asRecord(clone.child).parent).toBe(clone);
  });

  it("preserves array cycles", () => {
    const list: unknown[] = [1];
    list.push(list);
    const clone = deepClone(list);
    expect(clone).not.toBe(list);
    expect(clone[0]).toBe(1);
    expect(clone[1]).toBe(clone);
  });

  it("clones shared references once", () => {
    const shared = { a: 1 };
    const clone = deepClone({ x: shared, y: shared });
    expect(clone.x).toEqual({ a: 1 });
    expect(clone.x).not.toBe(shared);
    expect(clone.x).toBe(clone.y);
  });
});

describe("convertRecord", () => {
  it("routes listed fields through their converters and deep-clones the rest", () => {
    const extra = { deep: true };
    const result = asRecord(
      convertRecord(
        { a: 1, b: 2, extra },
        { a: (item) => [item], b: () => "converted" }
      )
    );
    expect(result).toEqual({ a: [1], b: "converted", extra: { deep: true } });
    expect(result.extra).not.toBe(extra);
  });

  it("removes fields mapped to DROP and fields whose converter returns DROP", () => {
    const result = convertRecord(
      { gone: 1, kept: 2, maybe: 3 },
      { gone: DROP, maybe: (item) => (item === 3 ? DROP : item) }
    );
    expect(result).toEqual({ kept: 2 });
  });

  it("passes the whole source record to converters and to finish", () => {
    const source = { flag: true, value: 1 };
    const result = convertRecord(
      source,
      { value: (item, record) => (record.flag ? item : DROP) },
      (out, record) => ({ ...out, sameSource: record === source })
    );
    expect(result).toEqual({ flag: true, sameSource: true, value: 1 });
  });

  it("lets finish replace the whole result", () => {
    expect(convertRecord({ a: 1 }, {}, () => DROP)).toBe(DROP);
  });

  it("preserves key order", () => {
    const input: UnknownRecord = {};
    input.zebra = 1;
    input.apple = 2;
    input.mango = 3;
    const result = asRecord(convertRecord(input, { apple: identity }));
    expect(Object.keys(result)).toEqual(["zebra", "apple", "mango"]);
  });

  it("deep-clones non-object input without consulting the table", () => {
    const convert = vi.fn(identity);
    const list = [{ a: 1 }];
    const result = convertRecord(list, { a: convert });
    expect(result).toEqual(list);
    expect(result).not.toBe(list);
    expect(convertRecord("text", { a: convert })).toBe("text");
    expect(convertRecord(null, { a: convert })).toBe(null);
    expect(convert).not.toHaveBeenCalled();
  });

  it("does not look up table entries through the prototype chain", () => {
    const input: unknown = JSON.parse(
      '{"constructor": 1, "toString": 2, "__proto__": {"polluted": true}}'
    );
    const result = asRecord(convertRecord(input, {}));
    expect(Object.getOwnPropertyDescriptor(result, "constructor")?.value).toBe(
      1
    );
    expect(Object.getOwnPropertyDescriptor(result, "toString")?.value).toBe(2);
    expect(Object.getOwnPropertyDescriptor(result, "__proto__")?.value).toEqual(
      { polluted: true }
    );
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(asRecord({}).polluted).toBeUndefined();
  });

  it("falls back to a cycle-preserving clone when re-entered for the same object", () => {
    const node: UnknownRecord = { name: "root" };
    node.self = node;
    const result = asRecord(convertNode(node));
    expect(result.name).toBe("converted");
    const inner = asRecord(result.self);
    expect(inner).not.toBe(node);
    expect(inner.name).toBe("root");
    expect(inner.self).toBe(inner);
  });

  it("converts shared acyclic references at every occurrence", () => {
    const shared = { name: "x" };
    const result = convertRecord(
      { a: shared, b: shared },
      {
        a: (item) => convertRecord(item, { name: () => "a" }),
        b: (item) => convertRecord(item, { name: () => "b" }),
      }
    );
    expect(result).toEqual({ a: { name: "a" }, b: { name: "b" } });
  });

  it("releases the cycle guard when a converter throws", () => {
    const value = { a: 1 };
    expect(() =>
      convertRecord(value, {
        a: () => {
          throw new Error("boom");
        },
      })
    ).toThrow("boom");
    expect(convertRecord(value, { a: () => 2 })).toEqual({ a: 2 });
  });
});

describe("operationFields", () => {
  it("routes every HTTP method of a path item to the converter", () => {
    const fields = operationFields(identity);
    expect(Object.keys(fields)).toEqual([...HTTP_METHODS]);
    expect(Object.values(fields).every((entry) => entry === identity)).toBe(
      true
    );
  });
});

describe("mapRecord", () => {
  it("applies the converter to every value with the key as second argument", () => {
    const calls: [unknown, string][] = [];
    const result = mapRecord({ a: 1, b: 2 }, (item, key) => {
      calls.push([item, key]);
      // SAFETY: the test input only contains numbers.
      return (item as number) * 10;
    });
    expect(result).toEqual({ a: 10, b: 20 });
    expect(calls).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
  });

  it("leaves out entries whose converter returns DROP", () => {
    const result = mapRecord({ a: 1, b: 2, c: 3 }, (item) =>
      item === 2 ? DROP : item
    );
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("preserves key order", () => {
    const input: UnknownRecord = {};
    input.zebra = 1;
    input.apple = 2;
    const result = asRecord(mapRecord(input, identity));
    expect(Object.keys(result)).toEqual(["zebra", "apple"]);
  });

  it("deep-clones non-object input unchanged without calling the converter", () => {
    const convert = vi.fn(identity);
    const array = [{ nested: true }];
    const result = mapRecord(array, convert);
    expect(result).toEqual(array);
    expect(result).not.toBe(array);
    expect(mapRecord("text", convert)).toBe("text");
    expect(mapRecord(null, convert)).toBe(null);
    expect(convert).not.toHaveBeenCalled();
  });
});

describe("mapArray", () => {
  it("applies the converter to every element", () => {
    const result = mapArray(
      [1, 2, 3],
      (item) =>
        // SAFETY: the test input only contains numbers.
        (item as number) + 1
    );
    expect(result).toEqual([2, 3, 4]);
  });

  it("leaves out elements whose converter returns DROP", () => {
    const result = mapArray([1, 2, 3], (item) => (item === 2 ? DROP : item));
    expect(result).toEqual([1, 3]);
  });

  it("deep-clones non-array input unchanged without calling the converter", () => {
    const convert = vi.fn(identity);
    const record = { nested: { deep: true } };
    const result = mapArray(record, convert);
    expect(result).toEqual(record);
    expect(result).not.toBe(record);
    expect(mapArray(7, convert)).toBe(7);
    expect(mapArray(undefined, convert)).toBe(undefined);
    expect(convert).not.toHaveBeenCalled();
  });
});

describe("getRef", () => {
  it("returns the $ref string of a reference-shaped object", () => {
    expect(getRef({ $ref: "#/components/schemas/Pet" })).toBe(
      "#/components/schemas/Pet"
    );
  });

  it("returns undefined for non-objects", () => {
    expect(getRef(null)).toBeUndefined();
    expect(getRef("#/ref")).toBeUndefined();
    expect(getRef(42)).toBeUndefined();
    expect(getRef([{ $ref: "#/x" }])).toBeUndefined();
  });

  it("returns undefined when $ref is missing or not a string", () => {
    expect(getRef({})).toBeUndefined();
    expect(getRef({ ref: "#/x" })).toBeUndefined();
    expect(getRef({ $ref: 42 })).toBeUndefined();
    expect(getRef({ $ref: { nested: true } })).toBeUndefined();
    expect(getRef({ $ref: null })).toBeUndefined();
  });
});

describe("setKey", () => {
  it("defines an enumerable, writable, configurable own property", () => {
    const target: UnknownRecord = {};
    setKey(target, "name", "value");
    expect(Object.getOwnPropertyDescriptor(target, "name")).toEqual({
      configurable: true,
      enumerable: true,
      value: "value",
      writable: true,
    });
  });

  it("sets a __proto__ key as a plain own property without prototype pollution", () => {
    const target: UnknownRecord = {};
    setKey(target, "__proto__", { polluted: true });
    const descriptor = Object.getOwnPropertyDescriptor(target, "__proto__");
    expect(descriptor?.value).toEqual({ polluted: true });
    expect(descriptor?.enumerable).toBe(true);
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(asRecord({}).polluted).toBeUndefined();
  });
});
