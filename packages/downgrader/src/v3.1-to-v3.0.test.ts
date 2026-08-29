/* oxlint-disable anti-slop/no-unknown-parameters -- the cast helpers deliberately accept `unknown` so tests can feed malformed input to the graceful-degradation branches */

import type { OpenAPIV3_1 } from "@oasty/types";

import { downgradeSchemaV31ToV30, downgradeSpecV31ToV30 } from "./v3.1-to-v3.0";

const asSpec = (value: unknown): OpenAPIV3_1.OpenAPIObject =>
  // SAFETY: tests deliberately feed malformed or loosely-shaped documents to exercise graceful handling.
  value as OpenAPIV3_1.OpenAPIObject;

const asSchema = (value: unknown): OpenAPIV3_1.SchemaObject =>
  // SAFETY: tests deliberately feed malformed or loosely-shaped schemas to exercise graceful handling.
  value as OpenAPIV3_1.SchemaObject;

const info = { title: "t", version: "1" };

describe("downgradeSpecV31ToV30", () => {
  describe("version and top-level keys", () => {
    it("rewrites the openapi version to 3.0.4", () => {
      expect(
        downgradeSpecV31ToV30({ info, openapi: "3.1.1", paths: {} })
      ).toEqual({ info, openapi: "3.0.4", paths: {} });
    });

    it("adds openapi 3.0.4 when the openapi key is missing", () => {
      expect(downgradeSpecV31ToV30(asSpec({ info, paths: {} }))).toEqual({
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("clones non-object spec input unchanged", () => {
      expect(downgradeSpecV31ToV30(asSpec(null))).toBeNull();
      expect(downgradeSpecV31ToV30(asSpec(42))).toBe(42);
      expect(downgradeSpecV31ToV30(asSpec("spec"))).toBe("spec");
    });

    it("clones array spec input into a new array", () => {
      const input = [1, { a: 1 }];
      const result = downgradeSpecV31ToV30(asSpec(input));
      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it("drops jsonSchemaDialect", () => {
      expect(
        downgradeSpecV31ToV30({
          info,
          jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({ info, openapi: "3.0.4", paths: {} });
    });

    it("preserves unknown top-level keys and extensions", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            future: { a: 1 },
            info,
            openapi: "3.1.0",
            paths: {},
            "x-root": true,
          })
        )
      ).toEqual({
        future: { a: 1 },
        info,
        openapi: "3.0.4",
        paths: {},
        "x-root": true,
      });
    });
  });

  describe("info", () => {
    it("removes info.summary", () => {
      expect(
        downgradeSpecV31ToV30({
          info: { summary: "short", title: "t", version: "1" },
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        info: { title: "t", version: "1" },
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("removes license.identifier and keeps the other license fields", () => {
      expect(
        downgradeSpecV31ToV30({
          info: {
            license: {
              identifier: "MIT",
              name: "MIT",
              url: "https://opensource.org/license/mit",
            },
            title: "t",
            version: "1",
          },
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        info: {
          license: { name: "MIT", url: "https://opensource.org/license/mit" },
          title: "t",
          version: "1",
        },
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("clones malformed info unchanged", () => {
      expect(
        downgradeSpecV31ToV30(asSpec({ info: 42, openapi: "3.1.0", paths: {} }))
      ).toEqual({ info: 42, openapi: "3.0.4", paths: {} });
    });

    it("clones a malformed license unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            info: { license: "MIT", title: "t", version: "1" },
            openapi: "3.1.0",
            paths: {},
          })
        )
      ).toEqual({
        info: { license: "MIT", title: "t", version: "1" },
        openapi: "3.0.4",
        paths: {},
      });
    });
  });

  describe("paths", () => {
    it("adds an empty paths object when missing", () => {
      expect(downgradeSpecV31ToV30({ info, openapi: "3.1.0" })).toEqual({
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("converts path items and clones non-path keys in paths", () => {
      expect(
        downgradeSpecV31ToV30({
          info,
          openapi: "3.1.0",
          paths: {
            "/a": { get: { summary: "s" } },
            // Path-item-shaped on purpose: cloning must NOT convert it, so
            // no responses may be synthesized inside.
            "x-note": { get: { summary: "s" } },
          },
        })
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {
          "/a": {
            get: {
              responses: { default: { description: "" } },
              summary: "s",
            },
          },
          "x-note": { get: { summary: "s" } },
        },
      });
    });

    it("clones a malformed paths value unchanged", () => {
      expect(
        downgradeSpecV31ToV30(asSpec({ info, openapi: "3.1.0", paths: "junk" }))
      ).toEqual({ info, openapi: "3.0.4", paths: "junk" });
    });
  });

  describe("webhooks", () => {
    it("removes webhooks entirely", () => {
      const result = downgradeSpecV31ToV30({
        info,
        openapi: "3.1.0",
        webhooks: { newPet: { post: { summary: "s" } } },
      });
      expect(result).toEqual({ info, openapi: "3.0.4", paths: {} });
      expect(result).not.toHaveProperty("webhooks");
      expect(result).not.toHaveProperty("x-webhooks");
    });
  });

  describe("components.pathItems", () => {
    it("removes components.pathItems and keeps the other component maps", () => {
      const result = downgradeSpecV31ToV30({
        components: {
          pathItems: { Reusable: { get: { summary: "s" } } },
          schemas: { S: { type: "string" } },
        },
        info,
        openapi: "3.1.0",
        paths: {},
      });
      expect(result).toEqual({
        components: { schemas: { S: { type: "string" } } },
        info,
        openapi: "3.0.4",
        paths: {},
      });
      expect(result.components).not.toHaveProperty("pathItems");
      expect(result.components).not.toHaveProperty("x-pathItems");
    });

    it("leaves a path item $ref field pointing at components.pathItems untouched", () => {
      expect(
        downgradeSpecV31ToV30({
          info,
          openapi: "3.1.0",
          paths: {
            "/a": { $ref: "#/components/pathItems/Reusable", summary: "s" },
          },
        })
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {
          "/a": { $ref: "#/components/pathItems/Reusable", summary: "s" },
        },
      });
    });

    it("clones a non-string path item $ref unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({ info, openapi: "3.1.0", paths: { "/a": { $ref: 42 } } })
        )
      ).toEqual({ info, openapi: "3.0.4", paths: { "/a": { $ref: 42 } } });
    });

    it("leaves reference objects pointing at components.pathItems untouched apart from override stripping", () => {
      expect(
        downgradeSpecV31ToV30({
          components: {
            callbacks: {
              cb: { $ref: "#/components/pathItems/Reusable", summary: "s" },
            },
          },
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          callbacks: { cb: { $ref: "#/components/pathItems/Reusable" } },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });
  });

  describe("reference objects", () => {
    it("strips reference summary and description across components maps", () => {
      expect(
        downgradeSpecV31ToV30({
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
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          callbacks: { C: { $ref: "#/c/cb" } },
          examples: { E: { $ref: "#/c/e" } },
          headers: { H: { $ref: "#/c/h" } },
          links: { L: { $ref: "#/c/l" } },
          parameters: { P: { $ref: "#/c/p" } },
          requestBodies: { B: { $ref: "#/c/b" } },
          responses: { R: { $ref: "#/c/r" } },
          securitySchemes: { S: { $ref: "#/c/s" } },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("strips reference overrides inside operations and path items", () => {
      expect(
        downgradeSpecV31ToV30({
          info,
          openapi: "3.1.0",
          paths: {
            "/a": {
              get: {
                callbacks: { cb: { $ref: "#/c/cb", summary: "s" } },
                parameters: [{ $ref: "#/c/p", description: "d" }],
                requestBody: { $ref: "#/c/b", summary: "s" },
                responses: { "200": { $ref: "#/c/r", summary: "s" } },
              },
              parameters: [{ $ref: "#/c/pp", summary: "s" }],
            },
          },
        })
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {
          "/a": {
            get: {
              callbacks: { cb: { $ref: "#/c/cb" } },
              parameters: [{ $ref: "#/c/p" }],
              requestBody: { $ref: "#/c/b" },
              responses: { "200": { $ref: "#/c/r" } },
            },
            parameters: [{ $ref: "#/c/pp" }],
          },
        },
      });
    });

    it("strips reference overrides in response headers, links, and media type examples", () => {
      expect(
        downgradeSpecV31ToV30({
          components: {
            responses: {
              R: {
                content: {
                  "application/json": {
                    examples: { e: { $ref: "#/c/e", summary: "s" } },
                    schema: { type: ["string", "null"] },
                  },
                },
                description: "ok",
                headers: { H: { $ref: "#/c/h", summary: "s" } },
                links: { l: { $ref: "#/c/l", description: "d" } },
              },
            },
          },
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          responses: {
            R: {
              content: {
                "application/json": {
                  examples: { e: { $ref: "#/c/e" } },
                  schema: { nullable: true, type: "string" },
                },
              },
              description: "ok",
              headers: { H: { $ref: "#/c/h" } },
              links: { l: { $ref: "#/c/l" } },
            },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("keeps x- entries in a responses map unconverted", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            info,
            openapi: "3.1.0",
            paths: {
              "/a": {
                get: {
                  responses: {
                    "200": { description: "ok" },
                    "x-note": { $ref: "#/c/r", summary: "s" },
                  },
                },
              },
            },
          })
        )
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {
          "/a": {
            get: {
              responses: {
                "200": { description: "ok" },
                "x-note": { $ref: "#/c/r", summary: "s" },
              },
            },
          },
        },
      });
    });
  });

  describe("operations", () => {
    it("synthesizes a minimal default responses object when an operation lacks one", () => {
      expect(
        downgradeSpecV31ToV30({
          info,
          openapi: "3.1.0",
          paths: { "/a": { get: { operationId: "getA" } } },
        })
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {
          "/a": {
            get: {
              operationId: "getA",
              responses: { default: { description: "" } },
            },
          },
        },
      });
    });

    it("clones a malformed operation unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            info,
            openapi: "3.1.0",
            paths: { "/a": { get: "junk" } },
          })
        )
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: { "/a": { get: "junk" } },
      });
    });

    it("converts parameter schemas, content, and examples", () => {
      expect(
        downgradeSpecV31ToV30({
          components: {
            parameters: {
              P: {
                examples: { e: { $ref: "#/c/e", summary: "s" } },
                in: "query",
                name: "p",
                schema: { type: ["string", "null"] },
              },
              Q: {
                content: {
                  "text/plain": { schema: { type: ["integer", "null"] } },
                },
                in: "query",
                name: "q",
              },
            },
          },
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          parameters: {
            P: {
              examples: { e: { $ref: "#/c/e" } },
              in: "query",
              name: "p",
              schema: { nullable: true, type: "string" },
            },
            Q: {
              content: {
                "text/plain": {
                  schema: { nullable: true, type: "integer" },
                },
              },
              in: "query",
              name: "q",
            },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("converts request body content, media type encoding, and encoding headers", () => {
      expect(
        downgradeSpecV31ToV30({
          components: {
            requestBodies: {
              B: {
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
              },
            },
          },
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          requestBodies: {
            B: {
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
            },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });

    it("converts schemas under components.schemas including boolean schemas", () => {
      expect(
        downgradeSpecV31ToV30({
          components: {
            schemas: { S: { type: ["string", "null"] }, T: true },
          },
          info,
          openapi: "3.1.0",
          paths: {},
        })
      ).toEqual({
        components: {
          schemas: { S: { nullable: true, type: "string" }, T: {} },
        },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });
  });

  describe("security", () => {
    it("removes mutualTLS schemes and drops requirements that become empty", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            components: {
              securitySchemes: {
                api: { in: "header", name: "k", type: "apiKey" },
                mtls: { type: "mutualTLS" },
              },
            },
            info,
            openapi: "3.1.0",
            paths: {},
            security: [{ mtls: [] }, { api: [], mtls: [] }, {}],
          })
        )
      ).toEqual({
        components: {
          securitySchemes: {
            api: { in: "header", name: "k", type: "apiKey" },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
        security: [{ api: [] }, {}],
      });
    });

    it("empties roles on non-OAuth schemes", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            components: {
              securitySchemes: {
                api: { in: "header", name: "k", type: "apiKey" },
                basic: { scheme: "basic", type: "http" },
              },
            },
            info,
            openapi: "3.1.0",
            paths: {},
            security: [{ api: ["read"], basic: ["admin"] }],
          })
        )
      ).toEqual({
        components: {
          securitySchemes: {
            api: { in: "header", name: "k", type: "apiKey" },
            basic: { scheme: "basic", type: "http" },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
        security: [{ api: [], basic: [] }],
      });
    });

    it("keeps scopes for oauth2, openIdConnect, and unknown schemes", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            components: {
              securitySchemes: {
                oauth: { flows: {}, type: "oauth2" },
                oidc: { openIdConnectUrl: "https://x", type: "openIdConnect" },
              },
            },
            info,
            openapi: "3.1.0",
            paths: {},
            security: [{ oauth: ["read"], oidc: ["a"], unknownScheme: ["s"] }],
          })
        )
      ).toEqual({
        components: {
          securitySchemes: {
            oauth: { flows: {}, type: "oauth2" },
            oidc: { openIdConnectUrl: "https://x", type: "openIdConnect" },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {},
        security: [{ oauth: ["read"], oidc: ["a"], unknownScheme: ["s"] }],
      });
    });

    it("converts operation-level security lists", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            components: {
              securitySchemes: {
                api: { in: "header", name: "k", type: "apiKey" },
                mtls: { type: "mutualTLS" },
              },
            },
            info,
            openapi: "3.1.0",
            paths: {
              "/a": {
                get: {
                  responses: {},
                  security: [{ mtls: [] }, { api: ["read"] }],
                },
              },
            },
          })
        )
      ).toEqual({
        components: {
          securitySchemes: {
            api: { in: "header", name: "k", type: "apiKey" },
          },
        },
        info,
        openapi: "3.0.4",
        paths: {
          "/a": {
            get: { responses: {}, security: [{ api: [] }] },
          },
        },
      });
    });

    it("clones non-record security requirements unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            info,
            openapi: "3.1.0",
            paths: {},
            security: [{ api: [] }, "junk", 42],
          })
        )
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {},
        security: [{ api: [] }, "junk", 42],
      });
    });

    it("clones a non-array security value unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({ info, openapi: "3.1.0", paths: {}, security: { api: [] } })
        )
      ).toEqual({
        info,
        openapi: "3.0.4",
        paths: {},
        security: { api: [] },
      });
    });

    it("clones a malformed securitySchemes value unchanged", () => {
      expect(
        downgradeSpecV31ToV30(
          asSpec({
            components: { securitySchemes: "junk" },
            info,
            openapi: "3.1.0",
            paths: {},
          })
        )
      ).toEqual({
        components: { securitySchemes: "junk" },
        info,
        openapi: "3.0.4",
        paths: {},
      });
    });
  });

  describe("input non-mutation", () => {
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
  });
});

describe("downgradeSchemaV31ToV30", () => {
  describe("boolean and junk schemas", () => {
    it("converts the true schema to an empty object", () => {
      expect(downgradeSchemaV31ToV30(true)).toEqual({});
    });

    it("converts the false schema to a match-nothing object", () => {
      expect(downgradeSchemaV31ToV30(false)).toEqual({ not: {} });
    });

    it("clones junk primitive inputs unchanged", () => {
      expect(downgradeSchemaV31ToV30(asSchema(null))).toBeNull();
      expect(downgradeSchemaV31ToV30(asSchema(42))).toBe(42);
      expect(downgradeSchemaV31ToV30(asSchema("x"))).toBe("x");
    });

    it("clones array inputs into a new array", () => {
      const input = [{ type: "string" }];
      const result = downgradeSchemaV31ToV30(asSchema(input));
      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });
  });

  describe("$ref handling", () => {
    it("keeps a pure $ref as a bare reference object", () => {
      const input = { $ref: "#/components/schemas/Pet" };
      const result = downgradeSchemaV31ToV30(input);
      expect(result).toEqual({ $ref: "#/components/schemas/Pet" });
      expect(result).not.toBe(input);
    });

    it("leaves a schema $ref pointing at components.pathItems untouched", () => {
      expect(
        downgradeSchemaV31ToV30({ $ref: "#/components/pathItems/Foo" })
      ).toEqual({ $ref: "#/components/pathItems/Foo" });
    });

    it("wraps a $ref with sibling keywords into allOf", () => {
      expect(downgradeSchemaV31ToV30({ $ref: "#/c/s", minLength: 1 })).toEqual({
        allOf: [{ $ref: "#/c/s" }],
        minLength: 1,
      });
    });

    it("merges a $ref into an existing allOf", () => {
      expect(
        downgradeSchemaV31ToV30({ $ref: "#/c/s", allOf: [{ type: "string" }] })
      ).toEqual({ allOf: [{ $ref: "#/c/s" }, { type: "string" }] });
    });
  });

  describe("type", () => {
    it("keeps a single string type", () => {
      expect(downgradeSchemaV31ToV30({ type: "string" })).toEqual({
        type: "string",
      });
    });

    it("converts a type array with null into type plus nullable", () => {
      expect(downgradeSchemaV31ToV30({ type: ["string", "null"] })).toEqual({
        nullable: true,
        type: "string",
      });
    });

    it("converts a null-only type into nullable plus a null enum", () => {
      expect(downgradeSchemaV31ToV30({ type: ["null"] })).toEqual({
        enum: [null],
        nullable: true,
      });
      expect(downgradeSchemaV31ToV30({ type: "null" })).toEqual({
        enum: [null],
        nullable: true,
      });
    });

    it("does not overwrite an existing enum for a null-only type", () => {
      expect(
        downgradeSchemaV31ToV30({ enum: ["a", null], type: ["null"] })
      ).toEqual({ enum: ["a", null], nullable: true });
    });

    it("lets const provide the enum for a null-only type", () => {
      expect(downgradeSchemaV31ToV30({ const: 7, type: ["null"] })).toEqual({
        enum: [7],
        nullable: true,
      });
    });

    it("converts multiple non-null types into anyOf variants", () => {
      expect(downgradeSchemaV31ToV30({ type: ["string", "integer"] })).toEqual({
        anyOf: [{ type: "string" }, { type: "integer" }],
      });
    });

    it("converts multiple types with null into nullable anyOf variants", () => {
      expect(
        downgradeSchemaV31ToV30({ type: ["string", "integer", "null"] })
      ).toEqual({
        anyOf: [
          { nullable: true, type: "string" },
          { nullable: true, type: "integer" },
        ],
      });
    });

    it("wraps the type union into allOf when anyOf already exists", () => {
      expect(
        downgradeSchemaV31ToV30({
          anyOf: [{ minLength: 1 }],
          type: ["string", "integer"],
        })
      ).toEqual({
        allOf: [{ anyOf: [{ type: "string" }, { type: "integer" }] }],
        anyOf: [{ minLength: 1 }],
      });
    });

    it("appends the type union to an existing allOf when anyOf also exists", () => {
      expect(
        downgradeSchemaV31ToV30({
          allOf: [{ title: "t" }],
          anyOf: [{ minLength: 1 }],
          type: ["string", "integer"],
        })
      ).toEqual({
        allOf: [
          { title: "t" },
          { anyOf: [{ type: "string" }, { type: "integer" }] },
        ],
        anyOf: [{ minLength: 1 }],
      });
    });

    it("passes junk type values through unchanged", () => {
      expect(downgradeSchemaV31ToV30(asSchema({ type: 42 }))).toEqual({
        type: 42,
      });
      expect(downgradeSchemaV31ToV30(asSchema({ type: { a: 1 } }))).toEqual({
        type: { a: 1 },
      });
    });

    it("deduplicates and filters non-string entries in type arrays", () => {
      expect(
        downgradeSchemaV31ToV30(asSchema({ type: ["string", "string"] }))
      ).toEqual({ type: "string" });
      expect(
        downgradeSchemaV31ToV30(asSchema({ type: ["string", 42] }))
      ).toEqual({ type: "string" });
      expect(downgradeSchemaV31ToV30(asSchema({ type: [42] }))).toEqual({
        type: [42],
      });
    });

    it("drops an empty type array", () => {
      expect(downgradeSchemaV31ToV30({ type: [] })).toEqual({});
    });
  });

  describe("const", () => {
    it("converts const into a single-value enum", () => {
      expect(downgradeSchemaV31ToV30({ const: "a" })).toEqual({ enum: ["a"] });
    });

    it("converts falsy const values", () => {
      expect(downgradeSchemaV31ToV30({ const: 0 })).toEqual({ enum: [0] });
      expect(downgradeSchemaV31ToV30({ const: false })).toEqual({
        enum: [false],
      });
      expect(downgradeSchemaV31ToV30({ const: "" })).toEqual({ enum: [""] });
    });

    it("converts a null const and marks the schema nullable", () => {
      expect(downgradeSchemaV31ToV30({ const: null })).toEqual({
        enum: [null],
        nullable: true,
      });
    });

    it("replaces an existing enum with the const value", () => {
      expect(downgradeSchemaV31ToV30({ const: 5, enum: [1, 2] })).toEqual({
        enum: [5],
      });
    });
  });

  describe("exclusive bounds", () => {
    it("converts a numeric exclusiveMinimum into minimum plus flag", () => {
      expect(downgradeSchemaV31ToV30({ exclusiveMinimum: 3 })).toEqual({
        exclusiveMinimum: true,
        minimum: 3,
      });
    });

    it("keeps a tighter inclusive minimum and drops the exclusive one", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMinimum: 3, minimum: 5 })
      ).toEqual({ minimum: 5 });
    });

    it("overrides a looser inclusive minimum with the exclusive bound", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMinimum: 5, minimum: 3 })
      ).toEqual({ exclusiveMinimum: true, minimum: 5 });
    });

    it("prefers the exclusive form for equal minimum bounds", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMinimum: 3, minimum: 3 })
      ).toEqual({ exclusiveMinimum: true, minimum: 3 });
    });

    it("converts a numeric exclusiveMaximum into maximum plus flag", () => {
      expect(downgradeSchemaV31ToV30({ exclusiveMaximum: 10 })).toEqual({
        exclusiveMaximum: true,
        maximum: 10,
      });
    });

    it("keeps a tighter inclusive maximum and drops the exclusive one", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMaximum: 10, maximum: 5 })
      ).toEqual({ maximum: 5 });
    });

    it("overrides a looser inclusive maximum with the exclusive bound", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMaximum: 5, maximum: 10 })
      ).toEqual({ exclusiveMaximum: true, maximum: 5 });
    });

    it("prefers the exclusive form for equal maximum bounds", () => {
      expect(
        downgradeSchemaV31ToV30({ exclusiveMaximum: 5, maximum: 5 })
      ).toEqual({ exclusiveMaximum: true, maximum: 5 });
    });

    it("passes 3.0-style boolean exclusive bounds through unchanged", () => {
      expect(
        downgradeSchemaV31ToV30(
          asSchema({ exclusiveMinimum: true, minimum: 3 })
        )
      ).toEqual({ exclusiveMinimum: true, minimum: 3 });
      expect(
        downgradeSchemaV31ToV30(
          asSchema({ exclusiveMaximum: false, maximum: 3 })
        )
      ).toEqual({ exclusiveMaximum: false, maximum: 3 });
    });
  });

  describe("examples", () => {
    it("promotes the first examples entry to example", () => {
      expect(downgradeSchemaV31ToV30({ examples: ["a", "b"] })).toEqual({
        example: "a",
      });
    });

    it("keeps an explicit example over the examples entries", () => {
      expect(
        downgradeSchemaV31ToV30({ example: "e", examples: ["a"] })
      ).toEqual({ example: "e" });
    });

    it("drops empty examples arrays", () => {
      expect(downgradeSchemaV31ToV30({ examples: [] })).toEqual({});
    });

    it("drops non-array examples values", () => {
      expect(downgradeSchemaV31ToV30(asSchema({ examples: "junk" }))).toEqual(
        {}
      );
    });
  });

  describe("content keywords", () => {
    it("converts contentEncoding base64 into format byte", () => {
      expect(downgradeSchemaV31ToV30({ contentEncoding: "base64" })).toEqual({
        format: "byte",
      });
    });

    it("keeps an existing format over contentEncoding", () => {
      expect(
        downgradeSchemaV31ToV30({
          contentEncoding: "base64",
          format: "custom",
        })
      ).toEqual({ format: "custom" });
    });

    it("drops other content encodings", () => {
      expect(downgradeSchemaV31ToV30({ contentEncoding: "gzip" })).toEqual({});
    });

    it("converts contentMediaType application/octet-stream into format binary", () => {
      expect(
        downgradeSchemaV31ToV30({
          contentMediaType: "application/octet-stream",
        })
      ).toEqual({ format: "binary" });
    });

    it("does not emit format binary when a contentEncoding is present", () => {
      expect(
        downgradeSchemaV31ToV30({
          contentEncoding: "gzip",
          contentMediaType: "application/octet-stream",
        })
      ).toEqual({});
    });

    it("drops other content media types", () => {
      expect(
        downgradeSchemaV31ToV30({ contentMediaType: "image/png" })
      ).toEqual({});
    });

    it("drops contentSchema", () => {
      expect(
        downgradeSchemaV31ToV30({ contentSchema: { type: "string" } })
      ).toEqual({});
    });
  });

  describe("dropped keywords", () => {
    it("removes every keyword with no 3.0 equivalent", () => {
      expect(
        downgradeSchemaV31ToV30({
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
  });

  describe("items and prefixItems", () => {
    it("drops prefixItems together with its trailing items", () => {
      expect(
        downgradeSchemaV31ToV30({
          items: { type: "integer" },
          prefixItems: [{ type: "string" }],
        })
      ).toEqual({});
    });

    it("keeps and converts items when there are no prefixItems", () => {
      expect(
        downgradeSchemaV31ToV30({ items: { type: ["string", "null"] } })
      ).toEqual({ items: { nullable: true, type: "string" } });
    });

    it("converts boolean items", () => {
      expect(downgradeSchemaV31ToV30({ items: true })).toEqual({ items: {} });
      expect(downgradeSchemaV31ToV30({ items: false })).toEqual({
        items: { not: {} },
      });
    });

    it("adds empty items when type array has none", () => {
      expect(downgradeSchemaV31ToV30({ type: "array" })).toEqual({
        items: {},
        type: "array",
      });
      expect(downgradeSchemaV31ToV30({ type: ["array", "null"] })).toEqual({
        items: {},
        nullable: true,
        type: "array",
      });
    });
  });

  describe("required", () => {
    it("drops an empty required array", () => {
      expect(downgradeSchemaV31ToV30({ required: [] })).toEqual({});
    });

    it("keeps a non-empty required array", () => {
      expect(downgradeSchemaV31ToV30({ required: ["a"] })).toEqual({
        required: ["a"],
      });
    });

    it("clones a non-array required value unchanged", () => {
      expect(downgradeSchemaV31ToV30(asSchema({ required: "junk" }))).toEqual({
        required: "junk",
      });
    });
  });

  describe("recursion", () => {
    it("converts nested property schemas", () => {
      expect(
        downgradeSchemaV31ToV30({
          properties: { a: { type: ["string", "null"] }, b: true },
          type: "object",
        })
      ).toEqual({
        properties: { a: { nullable: true, type: "string" }, b: {} },
        type: "object",
      });
    });

    it("keeps boolean additionalProperties and converts schema ones", () => {
      expect(downgradeSchemaV31ToV30({ additionalProperties: true })).toEqual({
        additionalProperties: true,
      });
      expect(downgradeSchemaV31ToV30({ additionalProperties: false })).toEqual({
        additionalProperties: false,
      });
      expect(
        downgradeSchemaV31ToV30({
          additionalProperties: { type: ["string", "null"] },
        })
      ).toEqual({
        additionalProperties: { nullable: true, type: "string" },
      });
    });

    it("converts allOf, anyOf, oneOf, and not members", () => {
      expect(
        downgradeSchemaV31ToV30({
          allOf: [true],
          anyOf: [{ const: 1 }],
          not: false,
          oneOf: [{ type: ["integer", "null"] }],
        })
      ).toEqual({
        allOf: [{}],
        anyOf: [{ enum: [1] }],
        not: { not: {} },
        oneOf: [{ nullable: true, type: "integer" }],
      });
    });

    it("clones a non-array allOf value unchanged", () => {
      expect(downgradeSchemaV31ToV30(asSchema({ allOf: "junk" }))).toEqual({
        allOf: "junk",
      });
    });
  });

  describe("extensions", () => {
    it("preserves x- keys and unknown keywords", () => {
      expect(
        downgradeSchemaV31ToV30({
          customKeyword: "v",
          title: "t",
          "x-foo": { a: 1 },
        })
      ).toEqual({ customKeyword: "v", title: "t", "x-foo": { a: 1 } });
    });
  });

  describe("input non-mutation", () => {
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
  });
});

describe("graceful handling of malformed nested objects", () => {
  it("clones malformed path items, parameters, request bodies, responses, media types, and encodings", () => {
    const spec = asSpec({
      info,
      openapi: "3.1.0",
      paths: {
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
        "/junk": "junk",
      },
    });
    expect(downgradeSpecV31ToV30(spec)).toEqual({
      info,
      openapi: "3.0.4",
      paths: {
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
        "/junk": "junk",
      },
    });
  });

  it("converts inline callback objects, cloning x- keys and junk entries", () => {
    const spec = asSpec({
      components: {
        callbacks: {
          junkCallback: 42,
          realCallback: {
            "x-note": { "{$expr}": { get: {} } },
            "{$request.body#/url}": { post: { summary: "s" } },
          },
        },
        "x-extra": { keep: true },
      },
      info,
      openapi: "3.1.0",
      paths: {
        "/a": {
          get: {
            callbacks: {
              inline: {
                expr: { get: {} },
                "x-k": { expr: { get: {} } },
              },
              junk: 7,
            },
            responses: {},
          },
        },
      },
    });
    expect(downgradeSpecV31ToV30(spec)).toEqual({
      components: {
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
        "x-extra": { keep: true },
      },
      info,
      openapi: "3.0.4",
      paths: {
        "/a": {
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
        },
      },
    });
  });

  it("clones a malformed components value unchanged", () => {
    expect(
      downgradeSpecV31ToV30(
        asSpec({ components: "junk", info, openapi: "3.1.0", paths: {} })
      )
    ).toEqual({ components: "junk", info, openapi: "3.0.4", paths: {} });
  });
});

describe("xml nodeType from chained 3.2 documents", () => {
  it("converts nodeType attribute to attribute: true", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ type: "string", xml: { name: "n", nodeType: "attribute" } })
      )
    ).toEqual({ type: "string", xml: { attribute: true, name: "n" } });
  });

  it("converts nodeType element on an array schema to wrapped: true", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ items: {}, type: "array", xml: { nodeType: "element" } })
      )
    ).toEqual({ items: {}, type: "array", xml: { wrapped: true } });
  });

  it("converts nodeType element on a nullable array schema to wrapped: true", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ type: ["array", "null"], xml: { nodeType: "element" } })
      )
    ).toEqual({
      items: {},
      nullable: true,
      type: "array",
      xml: { wrapped: true },
    });
  });

  it("removes nodeType element on non-array schemas", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ type: "string", xml: { nodeType: "element" } })
      )
    ).toEqual({ type: "string", xml: {} });
  });

  it("removes inexpressible nodeType values", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ type: "string", xml: { name: "n", nodeType: "text" } })
      )
    ).toEqual({ type: "string", xml: { name: "n" } });
  });

  it("clones xml objects without nodeType and malformed xml values unchanged", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ type: "string", xml: { attribute: true, name: "n" } })
      )
    ).toEqual({ type: "string", xml: { attribute: true, name: "n" } });
    expect(
      downgradeSchemaV31ToV30(asSchema({ type: "string", xml: "junk" }))
    ).toEqual({ type: "string", xml: "junk" });
  });
});

describe("malformed schema values pass through the conversion triggers", () => {
  it("passes a non-string $ref through unchanged", () => {
    expect(downgradeSchemaV31ToV30(asSchema({ $ref: 123 }))).toEqual({
      $ref: 123,
    });
    expect(
      downgradeSchemaV31ToV30(asSchema({ $ref: 123, type: "string" }))
    ).toEqual({ $ref: 123, type: "string" });
  });

  it("keeps a malformed allOf when a string $ref would otherwise be wrapped", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ $ref: "#/components/schemas/A", allOf: "junk" })
      )
    ).toEqual({ $ref: "#/components/schemas/A", allOf: "junk" });
  });

  it("keeps a malformed allOf when a type union would otherwise merge into it", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({
          allOf: "junk",
          anyOf: [{ type: "string" }],
          type: ["integer", "string"],
        })
      )
    ).toEqual({
      allOf: "junk",
      anyOf: [{ type: "string" }],
    });
  });
});

describe("type unions containing array", () => {
  it("gives synthesized array variants an empty items", () => {
    expect(
      downgradeSchemaV31ToV30(asSchema({ type: ["array", "string"] }))
    ).toEqual({
      anyOf: [{ items: {}, type: "array" }, { type: "string" }],
    });
  });

  it("copies existing items into the synthesized array variant", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({
          items: { type: "integer" },
          type: ["array", "string", "null"],
        })
      )
    ).toEqual({
      anyOf: [
        { items: { type: "integer" }, nullable: true, type: "array" },
        { nullable: true, type: "string" },
      ],
      items: { type: "integer" },
    });
  });
});

describe("patternProperties sibling handling", () => {
  it("drops additionalProperties together with patternProperties", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({
          additionalProperties: false,
          patternProperties: { "^x-": {} },
          properties: { name: { type: "string" } },
          type: "object",
        })
      )
    ).toEqual({
      properties: { name: { type: "string" } },
      type: "object",
    });
  });

  it("drops schema-valued additionalProperties together with patternProperties", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({
          additionalProperties: { type: "integer" },
          patternProperties: { "^x-": {} },
          type: "object",
        })
      )
    ).toEqual({ type: "object" });
  });
});

describe("3.0 enum and required constraints", () => {
  it("removes an empty enum", () => {
    expect(
      downgradeSchemaV31ToV30(asSchema({ enum: [], type: "string" }))
    ).toEqual({ type: "string" });
  });

  it("deduplicates required entries", () => {
    expect(
      downgradeSchemaV31ToV30(
        asSchema({ required: ["a", "b", "a"], type: "object" })
      )
    ).toEqual({ required: ["a", "b"], type: "object" });
  });
});

describe("mutualTLS reference aliases", () => {
  it("removes reference aliases of mutualTLS schemes and their requirements", () => {
    const result = downgradeSpecV31ToV30(
      asSpec({
        components: {
          securitySchemes: {
            api: { in: "header", name: "k", type: "apiKey" },
            clientCert: { $ref: "#/components/securitySchemes/mtlsBase" },
            mtlsBase: { type: "mutualTLS" },
          },
        },
        info,
        openapi: "3.1.0",
        paths: {},
        security: [{ clientCert: [] }, { api: [] }],
      })
    );
    expect(result).toEqual({
      components: {
        securitySchemes: { api: { in: "header", name: "k", type: "apiKey" } },
      },
      info,
      openapi: "3.0.4",
      paths: {},
      security: [{ api: [] }],
    });
  });

  it("survives cyclic and dangling security scheme aliases", () => {
    const result = downgradeSpecV31ToV30(
      asSpec({
        components: {
          securitySchemes: {
            dangling: { $ref: "#/components/securitySchemes/missing" },
            external: { $ref: "https://example.com/s.json#/schemes/a" },
            junk: 42,
            nested: { $ref: "#/components/securitySchemes/a/b" },
            ping: { $ref: "#/components/securitySchemes/pong" },
            pong: { $ref: "#/components/securitySchemes/ping" },
          },
        },
        info,
        openapi: "3.1.0",
        paths: {},
      })
    );
    expect(result.components?.securitySchemes).toEqual({
      dangling: { $ref: "#/components/securitySchemes/missing" },
      external: { $ref: "https://example.com/s.json#/schemes/a" },
      junk: 42,
      nested: { $ref: "#/components/securitySchemes/a/b" },
      ping: { $ref: "#/components/securitySchemes/pong" },
      pong: { $ref: "#/components/securitySchemes/ping" },
    });
  });
});

describe("security lists emptied by mutualTLS removal", () => {
  it("omits an operation security list that removal emptied", () => {
    const result = downgradeSpecV31ToV30(
      asSpec({
        components: { securitySchemes: { mtls: { type: "mutualTLS" } } },
        info,
        openapi: "3.1.0",
        paths: {
          "/admin": {
            get: { responses: {}, security: [{ mtls: [] }] },
          },
        },
        security: [{ mtls: [] }],
      })
    );
    const operation = result.paths?.["/admin"]?.get;
    expect(operation).toEqual({ responses: {} });
    expect(operation).not.toHaveProperty("security");
    expect(result).not.toHaveProperty("security");
  });

  it("keeps an explicitly empty security list", () => {
    const result = downgradeSpecV31ToV30(
      asSpec({
        info,
        openapi: "3.1.0",
        paths: { "/a": { get: { responses: {}, security: [] } } },
        security: [],
      })
    );
    expect(result.paths?.["/a"]?.get?.security).toEqual([]);
    expect(result.security).toEqual([]);
  });
});

describe("deep documents", () => {
  it("converts deeply nested schemas without throwing", () => {
    let deep = asSchema({ type: "string" });
    for (let index = 0; index < 1000; index += 1) {
      deep = asSchema({ items: deep, type: "array" });
    }
    expect(() => downgradeSchemaV31ToV30(deep)).not.toThrow();
  });
});
