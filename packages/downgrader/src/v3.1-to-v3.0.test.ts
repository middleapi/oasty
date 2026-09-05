/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns -- the helpers deliberately accept and return `unknown` so tests can feed malformed input to the graceful-degradation branches and inspect loosely-shaped output */

import type { OpenAPIV3_1 } from "@oasty/types";

import type { UnknownRecord } from "./shared";
import { downgradeSchemaV31ToV30, downgradeSpecV31ToV30 } from "./v3.1-to-v3.0";

const asSpec = (value: unknown): OpenAPIV3_1.OpenAPIObject =>
  // SAFETY: tests deliberately feed malformed or loosely-shaped documents to exercise graceful handling.
  value as OpenAPIV3_1.OpenAPIObject;

const asSchema = (value: unknown): OpenAPIV3_1.SchemaObject =>
  // SAFETY: tests deliberately feed malformed or loosely-shaped schemas to exercise graceful handling.
  value as OpenAPIV3_1.SchemaObject;

const dig = (value: unknown, ...path: string[]): unknown => {
  let current: unknown = value;
  for (const key of path) {
    // SAFETY: tests walk converter output whose shape the surrounding assertions pin down.
    current = (current as UnknownRecord)[key];
  }
  return current;
};

const info = { title: "t", version: "1" };

/** The smallest valid 3.1 document and its 3.0 counterpart. */
const base = { info, openapi: "3.1.0", paths: {} };
const converted = { info, openapi: "3.0.4", paths: {} };

const convertSpec = (fields: UnknownRecord) =>
  downgradeSpecV31ToV30(asSpec({ ...base, ...fields }));

const convertPathItem = (pathItem: unknown): unknown =>
  dig(convertSpec({ paths: { "/a": pathItem } }), "paths", "/a");

const convertComponent = (kind: string, value: unknown): unknown =>
  dig(
    convertSpec({ components: { [kind]: { X: value } } }),
    "components",
    kind,
    "X"
  );

const convertSchema = (schema: unknown): unknown =>
  downgradeSchemaV31ToV30(asSchema(schema));

describe("downgradeSpecV31ToV30", () => {
  describe("document", () => {
    it("rewrites the openapi version to 3.0.4", () => {
      expect(
        downgradeSpecV31ToV30({ info, openapi: "3.1.1", paths: {} })
      ).toEqual(converted);
    });

    it("adds openapi 3.0.4 and an empty paths object when they are missing", () => {
      expect(downgradeSpecV31ToV30(asSpec({ info }))).toEqual(converted);
    });

    it("removes jsonSchemaDialect and webhooks without leaving traces", () => {
      const result = convertSpec({
        jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
        webhooks: { newPet: { post: { summary: "s" } } },
      });
      expect(result).toEqual(converted);
      expect(result).not.toHaveProperty("x-webhooks");
    });

    it("preserves unknown top-level keys and extensions", () => {
      expect(convertSpec({ future: { a: 1 }, "x-root": true })).toEqual({
        ...converted,
        future: { a: 1 },
        "x-root": true,
      });
    });

    it("clones non-object input unchanged", () => {
      expect(downgradeSpecV31ToV30(asSpec(null))).toBeNull();
      expect(downgradeSpecV31ToV30(asSpec(42))).toBe(42);
      expect(downgradeSpecV31ToV30(asSpec("spec"))).toBe("spec");
      const list = [1, { a: 1 }];
      const result = downgradeSpecV31ToV30(asSpec(list));
      expect(result).toEqual(list);
      expect(result).not.toBe(list);
    });
  });

  describe("info", () => {
    it("removes summary and license.identifier and keeps the other fields", () => {
      expect(
        convertSpec({
          info: {
            license: {
              identifier: "MIT",
              name: "MIT",
              url: "https://opensource.org/license/mit",
            },
            summary: "short",
            title: "t",
            version: "1",
          },
        }).info
      ).toEqual({
        license: { name: "MIT", url: "https://opensource.org/license/mit" },
        title: "t",
        version: "1",
      });
    });

    it("clones malformed info and license values unchanged", () => {
      expect(convertSpec({ info: 42 }).info).toBe(42);
      expect(
        convertSpec({ info: { license: "MIT", title: "t", version: "1" } }).info
      ).toEqual({
        license: "MIT",
        title: "t",
        version: "1",
      });
    });
  });

  describe("paths", () => {
    it("converts path items and clones non-path keys", () => {
      expect(
        convertSpec({
          paths: {
            "/a": { get: { summary: "s" } },
            // Path-item-shaped on purpose: cloning must NOT convert it, so
            // no responses may be synthesized inside.
            "x-note": { get: { summary: "s" } },
          },
        }).paths
      ).toEqual({
        "/a": {
          get: { responses: { default: { description: "" } }, summary: "s" },
        },
        "x-note": { get: { summary: "s" } },
      });
    });

    it("leaves a path item $ref field untouched, string or not", () => {
      expect(
        convertPathItem({
          $ref: "#/components/pathItems/Reusable",
          summary: "s",
        })
      ).toEqual({
        $ref: "#/components/pathItems/Reusable",
        summary: "s",
      });
      expect(convertPathItem({ $ref: 42 })).toEqual({ $ref: 42 });
    });

    it("clones malformed paths, path items, operations, and nested objects unchanged", () => {
      expect(convertSpec({ paths: "junk" }).paths).toBe("junk");
      const paths = {
        "/a": {
          get: { requestBody: 42, responses: { "200": "junk" } },
          parameters: [42],
        },
        "/b": {
          post: {
            requestBody: {
              content: {
                "application/json": "junk",
                "multipart/form-data": { encoding: { field: "junk" } },
              },
            },
            responses: {},
          },
        },
        "/c": { get: "junk" },
        "/junk": "junk",
      };
      expect(convertSpec({ paths }).paths).toEqual(paths);
    });
  });

  describe("reference objects", () => {
    it("strips reference summary and description across components maps", () => {
      expect(
        convertSpec({
          components: {
            callbacks: { C: { $ref: "#/c/cb", summary: "s" } },
            examples: { E: { $ref: "#/c/e", description: "d" } },
            headers: { H: { $ref: "#/c/h", summary: "s" } },
            links: { L: { $ref: "#/c/l", description: "d" } },
            parameters: {
              P: { $ref: "#/c/p", description: "d", summary: "s" },
            },
            requestBodies: { B: { $ref: "#/c/b", summary: "s" } },
            responses: { R: { $ref: "#/c/r", description: "d" } },
            securitySchemes: { S: { $ref: "#/c/s", description: "d" } },
          },
        }).components
      ).toEqual({
        callbacks: { C: { $ref: "#/c/cb" } },
        examples: { E: { $ref: "#/c/e" } },
        headers: { H: { $ref: "#/c/h" } },
        links: { L: { $ref: "#/c/l" } },
        parameters: { P: { $ref: "#/c/p" } },
        requestBodies: { B: { $ref: "#/c/b" } },
        responses: { R: { $ref: "#/c/r" } },
        securitySchemes: { S: { $ref: "#/c/s" } },
      });
    });

    it("strips reference overrides inside operations and path items", () => {
      expect(
        convertPathItem({
          get: {
            callbacks: { cb: { $ref: "#/c/cb", summary: "s" } },
            parameters: [{ $ref: "#/c/p", description: "d" }],
            requestBody: { $ref: "#/c/b", summary: "s" },
            responses: { "200": { $ref: "#/c/r", summary: "s" } },
          },
          parameters: [{ $ref: "#/c/pp", summary: "s" }],
        })
      ).toEqual({
        get: {
          callbacks: { cb: { $ref: "#/c/cb" } },
          parameters: [{ $ref: "#/c/p" }],
          requestBody: { $ref: "#/c/b" },
          responses: { "200": { $ref: "#/c/r" } },
        },
        parameters: [{ $ref: "#/c/pp" }],
      });
    });

    it("strips reference overrides in response headers, links, and media type examples", () => {
      expect(
        convertComponent("responses", {
          content: {
            "application/json": {
              examples: { e: { $ref: "#/c/e", summary: "s" } },
              schema: { type: ["string", "null"] },
            },
          },
          description: "ok",
          headers: { H: { $ref: "#/c/h", summary: "s" } },
          links: { l: { $ref: "#/c/l", description: "d" } },
        })
      ).toEqual({
        content: {
          "application/json": {
            examples: { e: { $ref: "#/c/e" } },
            schema: { nullable: true, type: "string" },
          },
        },
        description: "ok",
        headers: { H: { $ref: "#/c/h" } },
        links: { l: { $ref: "#/c/l" } },
      });
    });

    it("keeps x- entries in a responses map unconverted", () => {
      const responses = {
        "200": { description: "ok" },
        "x-note": { $ref: "#/c/r", summary: "s" },
      };
      expect(convertPathItem({ get: { responses } })).toEqual({
        get: { responses },
      });
    });
  });

  describe("operations", () => {
    it("synthesizes a minimal default responses object when an operation lacks one", () => {
      expect(convertPathItem({ get: { operationId: "getA" } })).toEqual({
        get: {
          operationId: "getA",
          responses: { default: { description: "" } },
        },
      });
    });

    it("converts parameter schemas, content, and examples", () => {
      expect(
        convertPathItem({
          get: {
            parameters: [
              {
                examples: { e: { $ref: "#/c/e", summary: "s" } },
                in: "query",
                name: "p",
                schema: { type: ["string", "null"] },
              },
              {
                content: {
                  "text/plain": { schema: { type: ["integer", "null"] } },
                },
                in: "query",
                name: "q",
              },
            ],
            responses: {},
          },
        })
      ).toEqual({
        get: {
          parameters: [
            {
              examples: { e: { $ref: "#/c/e" } },
              in: "query",
              name: "p",
              schema: { nullable: true, type: "string" },
            },
            {
              content: {
                "text/plain": { schema: { nullable: true, type: "integer" } },
              },
              in: "query",
              name: "q",
            },
          ],
          responses: {},
        },
      });
    });

    it("adds required: true to path parameters that lack it", () => {
      expect(
        convertPathItem({
          get: {
            parameters: [
              {
                content: { "text/plain": { schema: { type: "string" } } },
                in: "path",
                name: "id",
              },
              { in: "query", name: "q", schema: {} },
            ],
            responses: {},
          },
        })
      ).toEqual({
        get: {
          parameters: [
            {
              content: { "text/plain": { schema: { type: "string" } } },
              in: "path",
              name: "id",
              required: true,
            },
            { in: "query", name: "q", schema: {} },
          ],
          responses: {},
        },
      });
    });

    it("converts request body content, media type encoding, and encoding headers", () => {
      expect(
        convertComponent("requestBodies", {
          content: {
            "multipart/form-data": {
              encoding: {
                field: {
                  contentType: "text/plain",
                  headers: {
                    H: { $ref: "#/c/h", summary: "s" },
                    H2: { schema: { type: ["string", "null"] } },
                  },
                },
              },
              example: { field: "v" },
              schema: { type: "object" },
            },
          },
          description: "body",
          required: true,
        })
      ).toEqual({
        content: {
          "multipart/form-data": {
            encoding: {
              field: {
                contentType: "text/plain",
                headers: {
                  H: { $ref: "#/c/h" },
                  H2: { schema: { nullable: true, type: "string" } },
                },
              },
            },
            example: { field: "v" },
            schema: { type: "object" },
          },
        },
        description: "body",
        required: true,
      });
    });

    it("converts inline callback objects, cloning x- keys and junk entries", () => {
      expect(
        convertPathItem({
          get: {
            callbacks: {
              inline: { expr: { get: {} }, "x-k": { expr: { get: {} } } },
              junk: 7,
            },
            responses: {},
          },
        })
      ).toEqual({
        get: {
          callbacks: {
            inline: {
              expr: { get: { responses: { default: { description: "" } } } },
              "x-k": { expr: { get: {} } },
            },
            junk: 7,
          },
          responses: {},
        },
      });
    });
  });

  describe("components", () => {
    it("removes pathItems and keeps the other component maps", () => {
      const result = convertSpec({
        components: {
          pathItems: { Reusable: { get: { summary: "s" } } },
          schemas: { S: { type: "string" } },
        },
      });
      expect(result.components).toEqual({ schemas: { S: { type: "string" } } });
      expect(result.components).not.toHaveProperty("x-pathItems");
    });

    it("leaves references into components.pathItems intact apart from override stripping", () => {
      expect(
        convertComponent("callbacks", {
          $ref: "#/components/pathItems/Reusable",
          summary: "s",
        })
      ).toEqual({ $ref: "#/components/pathItems/Reusable" });
    });

    it("converts component callbacks and schemas, including boolean schemas", () => {
      expect(
        convertSpec({
          components: {
            callbacks: {
              junkCallback: 42,
              realCallback: {
                "x-note": { "{$expr}": { get: {} } },
                "{$request.body#/url}": { post: { summary: "s" } },
              },
            },
            schemas: { S: { type: ["string", "null"] }, T: true },
            "x-extra": { keep: true },
          },
        }).components
      ).toEqual({
        callbacks: {
          junkCallback: 42,
          realCallback: {
            "x-note": { "{$expr}": { get: {} } },
            "{$request.body#/url}": {
              post: {
                responses: { default: { description: "" } },
                summary: "s",
              },
            },
          },
        },
        schemas: { S: { nullable: true, type: "string" }, T: {} },
        "x-extra": { keep: true },
      });
    });

    it("clones a malformed components value unchanged", () => {
      expect(convertSpec({ components: "junk" }).components).toBe("junk");
    });
  });

  describe("security", () => {
    const apiKey = { in: "header", name: "k", type: "apiKey" };

    it("removes mutualTLS schemes and drops requirements that become empty", () => {
      const result = convertSpec({
        components: {
          securitySchemes: { api: apiKey, mtls: { type: "mutualTLS" } },
        },
        security: [{ mtls: [] }, { api: [], mtls: [] }, {}],
      });
      expect(result.components).toEqual({ securitySchemes: { api: apiKey } });
      expect(result.security).toEqual([{ api: [] }, {}]);
    });

    it("removes reference aliases of mutualTLS schemes and their requirements", () => {
      const result = convertSpec({
        components: {
          securitySchemes: {
            api: apiKey,
            clientCert: { $ref: "#/components/securitySchemes/mtlsBase" },
            mtlsBase: { type: "mutualTLS" },
          },
        },
        security: [{ clientCert: [] }, { api: [] }],
      });
      expect(result.components).toEqual({ securitySchemes: { api: apiKey } });
      expect(result.security).toEqual([{ api: [] }]);
    });

    it("survives cyclic, dangling, external, and malformed scheme aliases", () => {
      const securitySchemes = {
        dangling: { $ref: "#/components/securitySchemes/missing" },
        external: { $ref: "https://example.com/s.json#/schemes/a" },
        junk: 42,
        nested: { $ref: "#/components/securitySchemes/a/b" },
        ping: { $ref: "#/components/securitySchemes/pong" },
        pong: { $ref: "#/components/securitySchemes/ping" },
      };
      expect(
        convertSpec({ components: { securitySchemes } }).components
      ).toEqual({
        securitySchemes,
      });
    });

    it("empties roles on non-OAuth schemes and keeps them elsewhere", () => {
      expect(
        convertSpec({
          components: {
            securitySchemes: {
              api: apiKey,
              basic: { scheme: "basic", type: "http" },
              oauth: { flows: {}, type: "oauth2" },
              oidc: { openIdConnectUrl: "https://x", type: "openIdConnect" },
            },
          },
          security: [
            { api: ["read"], basic: ["admin"] },
            { oauth: ["read"], oidc: ["a"], unknownScheme: ["s"] },
          ],
        }).security
      ).toEqual([
        { api: [], basic: [] },
        { oauth: ["read"], oidc: ["a"], unknownScheme: ["s"] },
      ]);
    });

    it("converts operation-level security lists", () => {
      expect(
        convertSpec({
          components: {
            securitySchemes: { api: apiKey, mtls: { type: "mutualTLS" } },
          },
          paths: {
            "/a": {
              get: {
                responses: {},
                security: [{ mtls: [] }, { api: ["read"] }],
              },
            },
          },
        }).paths
      ).toEqual({ "/a": { get: { responses: {}, security: [{ api: [] }] } } });
    });

    it("omits a security list that mutualTLS removal emptied instead of making it public", () => {
      const result = convertSpec({
        components: { securitySchemes: { mtls: { type: "mutualTLS" } } },
        paths: {
          "/admin": { get: { responses: {}, security: [{ mtls: [] }] } },
        },
        security: [{ mtls: [] }],
      });
      expect(result.paths).toEqual({ "/admin": { get: { responses: {} } } });
      expect(result).not.toHaveProperty("security");
    });

    it("keeps an explicitly empty security list", () => {
      const result = convertSpec({
        paths: { "/a": { get: { responses: {}, security: [] } } },
        security: [],
      });
      expect(result.paths).toEqual({
        "/a": { get: { responses: {}, security: [] } },
      });
      expect(result.security).toEqual([]);
    });

    it("clones malformed security values and scheme maps unchanged", () => {
      expect(
        convertSpec({ security: [{ api: [] }, "junk", 42] }).security
      ).toEqual([{ api: [] }, "junk", 42]);
      expect(convertSpec({ security: { api: [] } }).security).toEqual({
        api: [],
      });
      expect(
        convertSpec({ components: { securitySchemes: "junk" } }).components
      ).toEqual({
        securitySchemes: "junk",
      });
    });
  });

  describe("robustness", () => {
    it("never mutates the input document", () => {
      const input = asSpec({
        components: {
          pathItems: { Reusable: { get: { summary: "s" } } },
          schemas: { S: { $ref: "#/c/s", type: ["string", "null"] } },
          securitySchemes: {
            api: { in: "header", name: "k", type: "apiKey" },
            mtls: { type: "mutualTLS" },
          },
        },
        info: {
          license: { identifier: "MIT", name: "MIT" },
          summary: "short",
          title: "t",
          version: "1",
        },
        jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
        openapi: "3.1.0",
        paths: {
          "/a": {
            get: {
              parameters: [{ $ref: "#/c/p", summary: "s" }],
              security: [{ mtls: [] }, { api: ["read"] }],
            },
          },
        },
        security: [{ mtls: [] }],
        webhooks: { newPet: { post: { summary: "s" } } },
      });
      const before = structuredClone(input);
      downgradeSpecV31ToV30(input);
      expect(input).toEqual(before);
    });

    it("converts a path item that cycles through its callbacks without throwing", () => {
      const callback: UnknownRecord = {};
      const pathItem: UnknownRecord = {
        get: { callbacks: { cb: callback }, responses: {} },
      };
      callback.expr = pathItem;
      expect(() => convertPathItem(pathItem)).not.toThrow();
    });
  });
});

describe("downgradeSchemaV31ToV30", () => {
  describe("boolean and junk schemas", () => {
    it("converts the boolean schemas", () => {
      expect(downgradeSchemaV31ToV30(true)).toEqual({});
      expect(downgradeSchemaV31ToV30(false)).toEqual({ not: {} });
    });

    it("clones junk input unchanged", () => {
      expect(convertSchema(null)).toBeNull();
      expect(convertSchema(42)).toBe(42);
      expect(convertSchema("x")).toBe("x");
      const list = [{ type: "string" }];
      const result = convertSchema(list);
      expect(result).toEqual(list);
      expect(result).not.toBe(list);
    });
  });

  describe("$ref", () => {
    it("keeps a pure $ref as a bare reference object, wherever it points", () => {
      const input = { $ref: "#/components/schemas/Pet" };
      const result = downgradeSchemaV31ToV30(input);
      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(convertSchema({ $ref: "#/components/pathItems/Foo" })).toEqual({
        $ref: "#/components/pathItems/Foo",
      });
    });

    it.each([
      [
        "wraps a $ref with sibling keywords into allOf",
        { $ref: "#/c/s", minLength: 1 },
        { allOf: [{ $ref: "#/c/s" }], minLength: 1 },
      ],
      [
        "merges a $ref into an existing allOf",
        { $ref: "#/c/s", allOf: [{ type: "string" }] },
        { allOf: [{ $ref: "#/c/s" }, { type: "string" }] },
      ],
      [
        "keeps a malformed allOf and leaves the $ref in place",
        { $ref: "#/c/s", allOf: "junk" },
        { $ref: "#/c/s", allOf: "junk" },
      ],
      [
        "passes a non-string $ref through unchanged",
        { $ref: 123, type: "string" },
        { $ref: 123, type: "string" },
      ],
      [
        "passes a lone non-string $ref through unchanged",
        { $ref: 123 },
        { $ref: 123 },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("type", () => {
    it.each([
      ["keeps a single string type", { type: "string" }, { type: "string" }],
      [
        "converts a type array with null into type plus nullable",
        { type: ["string", "null"] },
        { nullable: true, type: "string" },
      ],
      [
        "converts a null-only type array into nullable plus a null enum",
        { type: ["null"] },
        { enum: [null], nullable: true },
      ],
      [
        "converts a null-only type string into nullable plus a null enum",
        { type: "null" },
        { enum: [null], nullable: true },
      ],
      [
        "intersects an existing enum with a null-only type",
        { enum: ["a", null], type: ["null"] },
        { enum: [null], nullable: true },
      ],
      [
        "matches nothing when the enum of a null-only type excludes null",
        { enum: ["a"], type: ["null"] },
        { enum: ["a"], not: {}, nullable: true },
      ],
      [
        "clones a malformed enum of a null-only type through",
        { enum: "junk", type: ["null"] },
        { enum: "junk", nullable: true },
      ],
      [
        "keeps a null const as the enum of a null-only type",
        { const: null, type: ["null"] },
        { enum: [null], nullable: true },
      ],
      [
        "matches nothing when a non-null const contradicts a null-only type",
        { const: 7, type: ["null"] },
        { enum: [7], not: {}, nullable: true },
      ],
      [
        "converts multiple non-null types into anyOf variants",
        { type: ["string", "integer"] },
        { anyOf: [{ type: "string" }, { type: "integer" }] },
      ],
      [
        "converts multiple types with null into nullable anyOf variants",
        { type: ["string", "integer", "null"] },
        {
          anyOf: [
            { nullable: true, type: "string" },
            { nullable: true, type: "integer" },
          ],
        },
      ],
      [
        "gives synthesized array variants an empty items",
        { type: ["array", "string"] },
        { anyOf: [{ items: {}, type: "array" }, { type: "string" }] },
      ],
      [
        "copies existing items into the synthesized array variant",
        { items: { type: "integer" }, type: ["array", "string", "null"] },
        {
          anyOf: [
            { items: { type: "integer" }, nullable: true, type: "array" },
            { nullable: true, type: "string" },
          ],
          items: { type: "integer" },
        },
      ],
      [
        "wraps the type union into allOf when anyOf already exists",
        { anyOf: [{ minLength: 1 }], type: ["string", "integer"] },
        {
          allOf: [{ anyOf: [{ type: "string" }, { type: "integer" }] }],
          anyOf: [{ minLength: 1 }],
        },
      ],
      [
        "appends the type union to an existing allOf when anyOf also exists",
        {
          allOf: [{ title: "t" }],
          anyOf: [{ minLength: 1 }],
          type: ["string", "integer"],
        },
        {
          allOf: [
            { title: "t" },
            { anyOf: [{ type: "string" }, { type: "integer" }] },
          ],
          anyOf: [{ minLength: 1 }],
        },
      ],
      [
        "drops the type union when anyOf exists and allOf is malformed",
        {
          allOf: "junk",
          anyOf: [{ type: "string" }],
          type: ["integer", "string"],
        },
        { allOf: "junk", anyOf: [{ type: "string" }] },
      ],
      [
        "deduplicates type array entries",
        { type: ["string", "string"] },
        { type: "string" },
      ],
      [
        "ignores non-string type array entries beside valid ones",
        { type: ["string", 42] },
        { type: "string" },
      ],
      [
        "passes a type array of only junk entries through",
        { type: [42] },
        { type: [42] },
      ],
      ["passes a junk number type through", { type: 42 }, { type: 42 }],
      [
        "passes a junk object type through",
        { type: { a: 1 } },
        { type: { a: 1 } },
      ],
      ["drops an empty type array", { type: [] }, {}],
      [
        "adds empty items to an array type without items",
        { type: "array" },
        { items: {}, type: "array" },
      ],
      [
        "adds empty items to a nullable array type without items",
        { type: ["array", "null"] },
        { items: {}, nullable: true, type: "array" },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("const", () => {
    it.each([
      [
        "converts const into a single-value enum",
        { const: "a" },
        { enum: ["a"] },
      ],
      ["converts a zero const", { const: 0 }, { enum: [0] }],
      ["converts a false const", { const: false }, { enum: [false] }],
      ["converts an empty-string const", { const: "" }, { enum: [""] }],
      [
        "converts a null const and marks the schema nullable",
        { const: null },
        { enum: [null], nullable: true },
      ],
      [
        "replaces an existing enum with the const value",
        { const: 5, enum: [1, 2] },
        { enum: [5] },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("exclusive bounds", () => {
    it.each([
      [
        "converts a numeric exclusiveMinimum into minimum plus flag",
        { exclusiveMinimum: 3 },
        { exclusiveMinimum: true, minimum: 3 },
      ],
      [
        "keeps a tighter inclusive minimum and drops the exclusive one",
        { exclusiveMinimum: 3, minimum: 5 },
        { minimum: 5 },
      ],
      [
        "overrides a looser inclusive minimum with the exclusive bound",
        { exclusiveMinimum: 5, minimum: 3 },
        { exclusiveMinimum: true, minimum: 5 },
      ],
      [
        "prefers the exclusive form for equal minimum bounds",
        { exclusiveMinimum: 3, minimum: 3 },
        { exclusiveMinimum: true, minimum: 3 },
      ],
      [
        "converts a numeric exclusiveMaximum into maximum plus flag",
        { exclusiveMaximum: 10 },
        { exclusiveMaximum: true, maximum: 10 },
      ],
      [
        "keeps a tighter inclusive maximum and drops the exclusive one",
        { exclusiveMaximum: 10, maximum: 5 },
        { maximum: 5 },
      ],
      [
        "overrides a looser inclusive maximum with the exclusive bound",
        { exclusiveMaximum: 5, maximum: 10 },
        { exclusiveMaximum: true, maximum: 5 },
      ],
      [
        "prefers the exclusive form for equal maximum bounds",
        { exclusiveMaximum: 5, maximum: 5 },
        { exclusiveMaximum: true, maximum: 5 },
      ],
      [
        "passes a 3.0-style boolean exclusiveMinimum through",
        { exclusiveMinimum: true, minimum: 3 },
        { exclusiveMinimum: true, minimum: 3 },
      ],
      [
        "passes a 3.0-style boolean exclusiveMaximum through",
        { exclusiveMaximum: false, maximum: 3 },
        { exclusiveMaximum: false, maximum: 3 },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("examples", () => {
    it.each([
      [
        "promotes the first examples entry to example",
        { examples: ["a", "b"] },
        { example: "a" },
      ],
      [
        "keeps an explicit example over the examples entries",
        { example: "e", examples: ["a"] },
        { example: "e" },
      ],
      ["drops empty examples arrays", { examples: [] }, {}],
      ["drops non-array examples values", { examples: "junk" }, {}],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("content keywords", () => {
    it.each([
      [
        "converts contentEncoding base64 into format byte",
        { contentEncoding: "base64" },
        { format: "byte" },
      ],
      [
        "keeps an existing format over contentEncoding",
        { contentEncoding: "base64", format: "custom" },
        { format: "custom" },
      ],
      ["drops other content encodings", { contentEncoding: "gzip" }, {}],
      [
        "converts contentMediaType application/octet-stream into format binary",
        { contentMediaType: "application/octet-stream" },
        { format: "binary" },
      ],
      [
        "does not emit format binary when a contentEncoding is present",
        {
          contentEncoding: "gzip",
          contentMediaType: "application/octet-stream",
        },
        {},
      ],
      [
        "drops other content media types",
        { contentMediaType: "image/png" },
        {},
      ],
      ["drops contentSchema", { contentSchema: { type: "string" } }, {}],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("dropped keywords", () => {
    it("removes every keyword with no 3.0 equivalent", () => {
      expect(
        convertSchema({
          $anchor: "a",
          $comment: "c",
          $defs: { D: { type: "string" } },
          $dynamicAnchor: "da",
          $dynamicRef: "#dr",
          $id: "https://example.com/s",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $vocabulary: { "https://example.com/v": true },
          contains: { type: "string" },
          contentSchema: { type: "string" },
          dependentRequired: { a: ["b"] },
          dependentSchemas: { a: { type: "object" } },
          else: { title: "e" },
          if: { title: "i" },
          maxContains: 2,
          minContains: 1,
          patternProperties: { "^x": { type: "string" } },
          prefixItems: [{ type: "string" }],
          propertyNames: { pattern: "^a" },
          // oxlint-disable-next-line no-thenable -- `then` is the JSON Schema keyword under test
          then: { title: "t" },
          type: "string",
          unevaluatedItems: false,
          unevaluatedProperties: false,
        })
      ).toEqual({ type: "string" });
    });

    it.each([
      [
        "drops prefixItems together with its trailing items",
        { items: { type: "integer" }, prefixItems: [{ type: "string" }] },
        {},
      ],
      [
        "drops boolean additionalProperties together with patternProperties",
        {
          additionalProperties: false,
          patternProperties: { "^x-": {} },
          properties: { name: { type: "string" } },
          type: "object",
        },
        { properties: { name: { type: "string" } }, type: "object" },
      ],
      [
        "drops schema-valued additionalProperties together with patternProperties",
        {
          additionalProperties: { type: "integer" },
          patternProperties: { "^x-": {} },
          type: "object",
        },
        { type: "object" },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("enum and required", () => {
    it.each([
      [
        "removes an empty enum",
        { enum: [], type: "string" },
        { type: "string" },
      ],
      [
        "keeps a non-empty enum",
        { enum: ["a"], type: "string" },
        { enum: ["a"], type: "string" },
      ],
      ["drops an empty required array", { required: [] }, {}],
      [
        "keeps a non-empty required array",
        { required: ["a"] },
        { required: ["a"] },
      ],
      [
        "deduplicates required entries",
        { required: ["a", "b", "a"], type: "object" },
        { required: ["a", "b"], type: "object" },
      ],
      [
        "clones a non-array required value unchanged",
        { required: "junk" },
        { required: "junk" },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("subschemas", () => {
    it.each([
      [
        "converts nested property schemas",
        {
          properties: { a: { type: ["string", "null"] }, b: true },
          type: "object",
        },
        {
          properties: { a: { nullable: true, type: "string" }, b: {} },
          type: "object",
        },
      ],
      [
        "keeps boolean additionalProperties",
        { additionalProperties: false },
        { additionalProperties: false },
      ],
      [
        "converts schema additionalProperties",
        { additionalProperties: { type: ["string", "null"] } },
        { additionalProperties: { nullable: true, type: "string" } },
      ],
      [
        "converts allOf, anyOf, oneOf, and not members",
        {
          allOf: [true],
          anyOf: [{ const: 1 }],
          not: false,
          oneOf: [{ type: ["integer", "null"] }],
        },
        {
          allOf: [{}],
          anyOf: [{ enum: [1] }],
          not: { not: {} },
          oneOf: [{ nullable: true, type: "integer" }],
        },
      ],
      [
        "clones a non-array allOf value unchanged",
        { allOf: "junk" },
        { allOf: "junk" },
      ],
      [
        "keeps and converts items when there are no prefixItems",
        { items: { type: ["string", "null"] } },
        { items: { nullable: true, type: "string" } },
      ],
      ["converts a true items schema", { items: true }, { items: {} }],
      [
        "converts a false items schema",
        { items: false },
        { items: { not: {} } },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("xml nodeType carried over from 3.2", () => {
    it.each([
      [
        "converts nodeType attribute to attribute: true",
        { type: "string", xml: { name: "n", nodeType: "attribute" } },
        { type: "string", xml: { attribute: true, name: "n" } },
      ],
      [
        "converts nodeType element on an array schema to wrapped: true",
        { items: {}, type: "array", xml: { nodeType: "element" } },
        { items: {}, type: "array", xml: { wrapped: true } },
      ],
      [
        "converts nodeType element on a nullable array schema to wrapped: true",
        { type: ["array", "null"], xml: { nodeType: "element" } },
        { items: {}, nullable: true, type: "array", xml: { wrapped: true } },
      ],
      [
        "removes nodeType element on non-array schemas",
        { type: "string", xml: { nodeType: "element" } },
        { type: "string", xml: {} },
      ],
      [
        "removes inexpressible nodeType values",
        { type: "string", xml: { name: "n", nodeType: "text" } },
        { type: "string", xml: { name: "n" } },
      ],
      [
        "clones xml objects without nodeType unchanged",
        { type: "string", xml: { attribute: true, name: "n" } },
        { type: "string", xml: { attribute: true, name: "n" } },
      ],
      [
        "clones malformed xml values unchanged",
        { type: "string", xml: "junk" },
        { type: "string", xml: "junk" },
      ],
    ])("%s", (_name, input, expected) => {
      expect(convertSchema(input)).toEqual(expected);
    });
  });

  describe("extensions and unknown keywords", () => {
    it("preserves x- keys and unknown keywords", () => {
      const input = { customKeyword: "v", title: "t", "x-foo": { a: 1 } };
      expect(convertSchema(input)).toEqual(input);
    });

    it("treats keywords named like Object.prototype members as unknown keywords", () => {
      const input = {
        constructor: 1,
        hasOwnProperty: 2,
        toString: 3,
        type: "string",
      };
      expect(convertSchema(input)).toEqual(input);
    });
  });

  describe("robustness", () => {
    it("never mutates the input schema", () => {
      const input = asSchema({
        $ref: "#/c/s",
        allOf: [{ type: "string" }],
        const: null,
        examples: ["a"],
        exclusiveMinimum: 5,
        minimum: 3,
        prefixItems: [{ type: "string" }],
        properties: { a: { type: ["string", "null"] } },
        type: ["object", "null"],
      });
      const before = structuredClone(input);
      downgradeSchemaV31ToV30(input);
      expect(input).toEqual(before);
    });

    it("converts deeply nested schemas without throwing", () => {
      let deep = asSchema({ type: "string" });
      for (let index = 0; index < 1000; index += 1) {
        deep = asSchema({ items: deep, type: "array" });
      }
      expect(() => downgradeSchemaV31ToV30(deep)).not.toThrow();
    });

    it("converts a schema whose subtree cycles back to itself without throwing", () => {
      const properties: UnknownRecord = {};
      const node: UnknownRecord = { properties, type: "object" };
      properties.self = node;
      expect(convertSchema(node)).toHaveProperty(
        ["properties", "self", "type"],
        "object"
      );
    });
  });
});
