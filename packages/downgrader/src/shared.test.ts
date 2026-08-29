import {
  deepClone,
  getRef,
  isRecord,
  mapArray,
  mapRecord,
  setKey,
} from "./shared";
import type { UnknownRecord } from "./shared";

const identity = <T>(value: T): T => value;

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

  it("keeps functions by reference", () => {
    const input = { fn: identity };
    const clone = deepClone(input);
    expect(clone.fn).toBe(identity);
  });

  it("keeps class instances by reference", () => {
    const date = new Date();
    const map = new Map<string, number>();
    const input = { date, map };
    const clone = deepClone(input);
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
    const clone = deepClone(input);
    // SAFETY: JSON.parse produces a plain object; the cast lets the test inspect its own keys.
    const cloneRecord = clone as UnknownRecord;
    expect(Object.getOwnPropertyNames(cloneRecord)).toContain("__proto__");
    const descriptor = Object.getOwnPropertyDescriptor(
      cloneRecord,
      "__proto__"
    );
    expect(descriptor?.value).toEqual({ polluted: true });
    expect(Object.getPrototypeOf(cloneRecord)).toBe(Object.prototype);
    // SAFETY: probing an arbitrary key on a fresh object to prove Object.prototype was not polluted.
    expect(({} as UnknownRecord).polluted).toBeUndefined();
  });

  it("preserves key order", () => {
    const input: UnknownRecord = {};
    input.zebra = 1;
    input.apple = 2;
    input.mango = 3;
    const clone = deepClone(input);
    expect(Object.keys(clone)).toEqual(["zebra", "apple", "mango"]);
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

  it("preserves key order", () => {
    const input: UnknownRecord = {};
    input.zebra = 1;
    input.apple = 2;
    const result = mapRecord(input, (item) => item);
    // SAFETY: mapRecord returns a plain object for plain-object input.
    expect(Object.keys(result as UnknownRecord)).toEqual(["zebra", "apple"]);
  });

  it("deep-clones non-object input unchanged without calling the converter", () => {
    const convert = vi.fn(identity);
    const array = [{ nested: true }];
    const result = mapRecord(array, convert);
    expect(result).toEqual(array);
    expect(result).not.toBe(array);
    expect(convert).not.toHaveBeenCalled();
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

  it("deep-clones non-array input unchanged without calling the converter", () => {
    const convert = vi.fn(identity);
    const record = { nested: { deep: true } };
    const result = mapArray(record, convert);
    expect(result).toEqual(record);
    expect(result).not.toBe(record);
    expect(convert).not.toHaveBeenCalled();
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

  it("returns undefined when $ref is missing", () => {
    expect(getRef({})).toBeUndefined();
    expect(getRef({ ref: "#/x" })).toBeUndefined();
  });

  it("returns undefined when $ref is not a string", () => {
    expect(getRef({ $ref: 42 })).toBeUndefined();
    expect(getRef({ $ref: { nested: true } })).toBeUndefined();
    expect(getRef({ $ref: null })).toBeUndefined();
  });
});

describe("setKey", () => {
  it("defines an enumerable, writable, configurable own property", () => {
    const target: UnknownRecord = {};
    setKey(target, "name", "value");
    const descriptor = Object.getOwnPropertyDescriptor(target, "name");
    expect(descriptor).toEqual({
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
    // SAFETY: probing an arbitrary key on a fresh object to prove Object.prototype was not polluted.
    expect(({} as UnknownRecord).polluted).toBeUndefined();
  });
});
