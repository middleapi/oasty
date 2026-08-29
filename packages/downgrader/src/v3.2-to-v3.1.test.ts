/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-unsafe-dictionary-type -- these tests feed deliberately malformed OpenAPI documents through the converters and inspect loosely-typed output, mirroring the converters' own defensive contract */

import type { OpenAPIV3_2 } from "@oasty/types";
import { describe, expect, it } from "vitest";

import type { UnknownRecord } from "./shared";
import { downgradeSchemaV32ToV31, downgradeSpecV32ToV31 } from "./v3.2-to-v3.1";

const asSpec = (value: unknown): OpenAPIV3_2.OpenAPIObject =>
  // SAFETY: tests deliberately feed malformed documents to exercise graceful handling.
  value as OpenAPIV3_2.OpenAPIObject;

const asSchema = (value: unknown): OpenAPIV3_2.SchemaObject =>
  // SAFETY: tests deliberately feed malformed schemas to exercise graceful handling.
  value as OpenAPIV3_2.SchemaObject;

const dig = (value: unknown, ...path: string[]): unknown => {
  let current: unknown = value;
  for (const key of path) {
    // SAFETY: tests walk converter output whose shape the surrounding assertions pin down.
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

describe("document version", () => {
  it("rewrites the openapi field to 3.1.2", () => {
    const result = downgradeSpecV32ToV31({
      info: { title: "t", version: "1.0.0" },
      openapi: "3.2.0",
    });
    expect(result).toEqual({
      info: { title: "t", version: "1.0.0" },
      openapi: "3.1.2",
    });
  });

  it("adds openapi: 3.1.2 when the input has no openapi field", () => {
    const result = downgradeSpecV32ToV31(asSpec({}));
    expect(result).toEqual({ openapi: "3.1.2" });
  });

  it("returns non-object input unchanged", () => {
    expect(downgradeSpecV32ToV31(asSpec(null))).toBeNull();
    expect(downgradeSpecV32ToV31(asSpec("junk"))).toBe("junk");
    expect(downgradeSpecV32ToV31(asSpec([1, 2]))).toEqual([1, 2]);
  });
});

describe("$self", () => {
  it("removes $self", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({ $self: "https://example.com/api.json", openapi: "3.2.0" })
    );
    expect(result).toEqual({ openapi: "3.1.2" });
  });
});

describe("servers", () => {
  it("removes server name in the root servers list", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        servers: [
          { description: "d", name: "prod", url: "https://example.com" },
        ],
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      servers: [{ description: "d", url: "https://example.com" }],
    });
  });

  it("removes server name in path item servers", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: { "/a": { servers: [{ name: "s", url: "/u" }] } },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: { "/a": { servers: [{ url: "/u" }] } },
    });
  });

  it("removes server name in operation servers", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: { responses: {}, servers: [{ name: "s", url: "/u" }] },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": { get: { responses: {}, servers: [{ url: "/u" }] } },
      },
    });
  });

  it("removes server name inside a link server", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          links: {
            L: { operationId: "op", server: { name: "s", url: "/u" } },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        links: { L: { operationId: "op", server: { url: "/u" } } },
      },
      openapi: "3.1.2",
    });
  });

  it("clones non-array servers and non-object server entries through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: { "/a": { servers: "junk" } },
        servers: [5, null],
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: { "/a": { servers: "junk" } },
      servers: [5, null],
    });
  });
});

describe("tags", () => {
  it("removes tag summary, parent, and kind and keeps other fields", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        tags: [
          {
            description: "d",
            externalDocs: { url: "https://example.com" },
            kind: "nav",
            name: "pets",
            parent: "animals",
            summary: "Pets",
          },
        ],
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      tags: [
        {
          description: "d",
          externalDocs: { url: "https://example.com" },
          name: "pets",
        },
      ],
    });
  });

  it("clones non-object tag entries through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({ openapi: "3.2.0", tags: ["junk", 1] })
    );
    expect(result).toEqual({ openapi: "3.1.2", tags: ["junk", 1] });
  });
});

describe("path item query and additionalOperations", () => {
  it("removes the query operation and keeps regular operations", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: { responses: {} },
            query: { description: "q", responses: {} },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: { "/a": { get: { responses: {} } } },
    });
  });

  it("removes additionalOperations whatever its shape", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": { additionalOperations: { NOTIFY: { description: "n" } } },
          "/b": { additionalOperations: "junk" },
          "/c": { additionalOperations: 42, query: "junk" },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: { "/a": {}, "/b": {}, "/c": {} },
    });
  });
});

describe("paths", () => {
  it("converts only keys starting with a slash and clones the rest", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": { query: { description: "dropped" } },
          "x-meta": { query: { description: "kept" } },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {},
        "x-meta": { query: { description: "kept" } },
      },
    });
  });

  it("clones non-object paths and path items through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({ openapi: "3.2.0", paths: { "/a": "junk" } })
    );
    expect(result).toEqual({ openapi: "3.1.2", paths: { "/a": "junk" } });
  });
});

describe("parameters", () => {
  it("removes querystring parameters from operation parameter lists, keeping neighbors and references", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                {
                  content: { "application/x-www-form-urlencoded": {} },
                  in: "querystring",
                  name: "q",
                },
                { in: "query", name: "keep" },
                { $ref: "#/components/parameters/P" },
              ],
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [
              { in: "query", name: "keep" },
              { $ref: "#/components/parameters/P" },
            ],
            responses: {},
          },
        },
      },
    });
  });

  it("removes querystring parameters from path item parameter lists", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            parameters: [
              { in: "querystring", name: "q" },
              { in: "path", name: "id", required: true },
            ],
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": { parameters: [{ in: "path", name: "id", required: true }] },
      },
    });
  });

  it("removes querystring entries from components.parameters, keeping neighbors and reference entries", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: {
            N: { in: "header", name: "h" },
            Q: { in: "querystring", name: "q" },
            R: { $ref: "#/components/parameters/N" },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        parameters: {
          N: { in: "header", name: "h" },
          R: { $ref: "#/components/parameters/N" },
        },
      },
      openapi: "3.1.2",
    });
  });

  it("clones a malformed components.parameters map through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({ components: { parameters: "junk" }, openapi: "3.2.0" })
    );
    expect(result).toEqual({
      components: { parameters: "junk" },
      openapi: "3.1.2",
    });
  });

  it("removes style: cookie and keeps the other fields", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: { P: { in: "cookie", name: "c", style: "cookie" } },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { parameters: { P: { in: "cookie", name: "c" } } },
      openapi: "3.1.2",
    });
  });

  it("keeps other style values", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: {
            P: { in: "query", name: "q", style: "deepObject" },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        parameters: { P: { in: "query", name: "q", style: "deepObject" } },
      },
      openapi: "3.1.2",
    });
  });

  it("keeps parameter schemas verbatim and converts example maps", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: {
            P: {
              examples: {
                inline: { dataValue: 1 },
                referenced: { $ref: "#/components/examples/E" },
              },
              in: "query",
              name: "q",
              schema: { type: "string", xml: { nodeType: "attribute" } },
            },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        parameters: {
          P: {
            examples: {
              inline: { value: 1 },
              referenced: { $ref: "#/components/examples/E" },
            },
            in: "query",
            name: "q",
            schema: { type: "string", xml: { nodeType: "attribute" } },
          },
        },
      },
      openapi: "3.1.2",
    });
  });

  it("clones non-object parameter entries and non-array parameter lists through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": { parameters: [null, "junk"] },
          "/b": { parameters: "junk" },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": { parameters: [null, "junk"] },
        "/b": { parameters: "junk" },
      },
    });
  });
});

describe("components.mediaTypes inlining", () => {
  it("inlines a media type reference in a request body content map with the converted media type", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          mediaTypes: { Stream: { itemSchema: { type: "object" } } },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/jsonl": {
                    $ref: "#/components/mediaTypes/Stream",
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "application/jsonl": {
                  schema: { items: { type: "object" }, type: "array" },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("inlines media type references in response, parameter, and header content maps", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          mediaTypes: { Json: { schema: { type: "string" } } },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                {
                  content: {
                    "application/json": {
                      $ref: "#/components/mediaTypes/Json",
                    },
                  },
                  in: "query",
                  name: "q",
                },
              ],
              responses: {
                "200": {
                  content: {
                    "application/json": {
                      $ref: "#/components/mediaTypes/Json",
                    },
                  },
                  description: "ok",
                  headers: {
                    "X-H": {
                      content: {
                        "application/json": {
                          $ref: "#/components/mediaTypes/Json",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    );
    const inlined = { schema: { type: "string" } };
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [
              {
                content: { "application/json": inlined },
                in: "query",
                name: "q",
              },
            ],
            responses: {
              "200": {
                content: { "application/json": inlined },
                description: "ok",
                headers: {
                  "X-H": { content: { "application/json": inlined } },
                },
              },
            },
          },
        },
      },
    });
  });

  it("resolves chained media type references down to the final object", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          mediaTypes: {
            A: { $ref: "#/components/mediaTypes/B" },
            B: { schema: { type: "number" } },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/json": { $ref: "#/components/mediaTypes/A" },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "application/json": { schema: { type: "number" } },
              },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("removes content entries whose reference chain is cyclic", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          mediaTypes: {
            Loop: { $ref: "#/components/mediaTypes/Loop" },
            Ping: { $ref: "#/components/mediaTypes/Pong" },
            Pong: { $ref: "#/components/mediaTypes/Ping" },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    $ref: "#/components/mediaTypes/Loop",
                  },
                  "application/xml": {
                    $ref: "#/components/mediaTypes/Ping",
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: { content: {} },
            responses: {},
          },
        },
      },
    });
  });

  it("resolves long acyclic reference chains", () => {
    const links = Array.from({ length: 40 }, (_unused, index) => [
      `m${index}`,
      { $ref: `#/components/mediaTypes/m${index + 1}` },
    ]);
    const mediaTypes = Object.fromEntries([
      ...links,
      ["m40", { schema: { type: "string" } }],
    ]);
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { mediaTypes },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/json": { $ref: "#/components/mediaTypes/m0" },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "application/json": { schema: { type: "string" } },
              },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("removes content entries with external and unparseable references", () => {
    const content = {
      "a/1": { $ref: "#/components/schemas/Foo" },
      "a/2": { $ref: "#/components/mediaTypes/nested/name" },
      "a/3": { $ref: "#/components/mediaTypes/" },
      "a/4": { $ref: "https://example.com/other.json#/mediaTypes/A" },
      "a/5": { $ref: "#/components/mediaTypes/Unknown" },
      "a/6": { $ref: "#/components/mediaTypes/Known" },
    };
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { mediaTypes: { Known: { example: 1 } } },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: { requestBody: { content }, responses: {} },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: { content: { "a/6": { example: 1 } } },
            responses: {},
          },
        },
      },
    });
  });

  it("does not resolve names through the prototype chain of the mediaTypes map", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { mediaTypes: {} },
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    $ref: "#/components/mediaTypes/hasOwnProperty",
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: { content: {} },
            responses: {},
          },
        },
      },
    });
  });

  it("removes media type references when components.mediaTypes is missing or malformed", () => {
    const content = {
      "application/json": { $ref: "#/components/mediaTypes/A" },
    };
    const withoutComponents = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": { post: { requestBody: { content }, responses: {} } },
        },
      })
    );
    expect(withoutComponents).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": { post: { requestBody: { content: {} }, responses: {} } },
      },
    });
    const withJunkMap = downgradeSpecV32ToV31(
      asSpec({
        components: { mediaTypes: "junk" },
        openapi: "3.2.0",
        paths: {
          "/a": { post: { requestBody: { content }, responses: {} } },
        },
      })
    );
    expect(withJunkMap).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": { post: { requestBody: { content: {} }, responses: {} } },
      },
    });
  });

  it("removes the mediaTypes map from components", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          mediaTypes: { Json: { schema: {} } },
          schemas: { S: { type: "string" } },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { schemas: { S: { type: "string" } } },
      openapi: "3.1.2",
    });
  });
});

describe("media types", () => {
  it("turns itemSchema into a deep-cloned array schema when no schema exists", () => {
    const itemSchema = { type: "object", xml: { nodeType: "text" } };
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: { "application/jsonl": { itemSchema } },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "application/jsonl": {
                  schema: {
                    items: { type: "object", xml: { nodeType: "text" } },
                    type: "array",
                  },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
    const promoted = dig(
      result,
      "paths",
      "/a",
      "post",
      "requestBody",
      "content",
      "application/jsonl",
      "schema",
      "items"
    );
    expect(promoted).not.toBe(itemSchema);
    expect(dig(promoted, "xml")).not.toBe(itemSchema.xml);
  });

  it("removes itemSchema when a schema already exists", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/jsonl": {
                    itemSchema: { type: "string" },
                    schema: { type: "array" },
                  },
                },
                required: true,
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: { "application/jsonl": { schema: { type: "array" } } },
              required: true,
            },
            responses: {},
          },
        },
      },
    });
  });

  it("removes media type prefixEncoding and itemEncoding", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "multipart/mixed": {
                    example: 1,
                    itemEncoding: { contentType: "text/plain" },
                    prefixEncoding: [{ contentType: "application/json" }],
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: { "multipart/mixed": { example: 1 } },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("removes nested encoding keys inside encoding objects while still converting headers", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "multipart/form-data": {
                    encoding: {
                      part: {
                        contentType: "application/json",
                        encoding: {
                          inner: { headers: { "X-C": { style: "cookie" } } },
                        },
                        headers: {
                          Referenced: { $ref: "#/components/headers/H" },
                          "X-H": { description: "h", style: "cookie" },
                        },
                        itemEncoding: { contentType: "text/plain" },
                        prefixEncoding: [{ contentType: "text/csv" }],
                      },
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "multipart/form-data": {
                  encoding: {
                    part: {
                      contentType: "application/json",
                      headers: {
                        Referenced: { $ref: "#/components/headers/H" },
                        "X-H": { description: "h" },
                      },
                    },
                  },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("converts example maps inside media types", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    examples: {
                      inline: { serializedValue: "raw" },
                      referenced: { $ref: "#/components/examples/E" },
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  examples: {
                    inline: { value: "raw" },
                    referenced: { $ref: "#/components/examples/E" },
                  },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
  });
});

describe("responses", () => {
  it("uses summary as the description when none exists", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { responses: { R: { summary: "ok" } } },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { responses: { R: { description: "ok" } } },
      openapi: "3.1.2",
    });
  });

  it("removes summary when a description exists", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          responses: { R: { description: "d", summary: "s" } },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { responses: { R: { description: "d" } } },
      openapi: "3.1.2",
    });
  });

  it("synthesizes an empty description when neither summary nor description exist", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { responses: { R: {} } },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { responses: { R: { description: "" } } },
      openapi: "3.1.2",
    });
  });

  it("leaves response reference objects untouched, including summary and description overrides", () => {
    const reference = {
      $ref: "#/components/responses/R",
      description: "override",
      summary: "kept",
    };
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: { "/a": { get: { responses: { "200": reference } } } },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: { "/a": { get: { responses: { "200": reference } } } },
    });
  });

  it("clones x- keys of the responses map without response conversion", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              responses: {
                "200": { summary: "ok" },
                "x-note": { summary: "not a response" },
              },
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            responses: {
              "200": { description: "ok" },
              "x-note": { summary: "not a response" },
            },
          },
        },
      },
    });
  });

  it("converts response headers, content, and links", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          responses: {
            R: {
              content: {
                "application/json": { itemSchema: { type: "string" } },
              },
              description: "ok",
              headers: { "X-H": { style: "cookie" } },
              links: {
                inline: { server: { name: "s", url: "/u" } },
                referenced: { $ref: "#/components/links/L" },
              },
            },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        responses: {
          R: {
            content: {
              "application/json": {
                schema: { items: { type: "string" }, type: "array" },
              },
            },
            description: "ok",
            headers: { "X-H": {} },
            links: {
              inline: { server: { url: "/u" } },
              referenced: { $ref: "#/components/links/L" },
            },
          },
        },
      },
      openapi: "3.1.2",
    });
  });
});

describe("examples", () => {
  const convertExampleComponent = (example: unknown): unknown =>
    dig(
      downgradeSpecV32ToV31(
        asSpec({
          components: { examples: { E: example } },
          openapi: "3.2.0",
        })
      ),
      "components",
      "examples",
      "E"
    );

  it("moves dataValue into the free value slot", () => {
    expect(convertExampleComponent({ dataValue: { a: 1 } })).toEqual({
      value: { a: 1 },
    });
  });

  it("moves serializedValue into the free value slot", () => {
    expect(convertExampleComponent({ serializedValue: "a=1" })).toEqual({
      value: "a=1",
    });
  });

  it("removes dataValue when value already exists", () => {
    expect(convertExampleComponent({ dataValue: 1, value: 2 })).toEqual({
      value: 2,
    });
  });

  it("removes serializedValue when value already exists", () => {
    expect(convertExampleComponent({ serializedValue: "s", value: 2 })).toEqual(
      { value: 2 }
    );
  });

  it("removes dataValue and serializedValue when externalValue exists", () => {
    expect(
      convertExampleComponent({
        dataValue: 1,
        externalValue: "https://example.com/e.json",
        serializedValue: "s",
      })
    ).toEqual({ externalValue: "https://example.com/e.json" });
  });

  it("lets dataValue win the value slot over serializedValue", () => {
    expect(
      convertExampleComponent({ dataValue: 1, serializedValue: "s" })
    ).toEqual({ value: 1 });
  });

  it("keeps other example fields untouched", () => {
    expect(
      convertExampleComponent({ dataValue: 1, description: "d", summary: "s" })
    ).toEqual({ description: "d", summary: "s", value: 1 });
  });

  it("leaves an example without any value fields unchanged", () => {
    expect(convertExampleComponent({ summary: "s" })).toEqual({
      summary: "s",
    });
  });
});

describe("schema passthrough", () => {
  it("deep-clones schemas, preserving discriminator defaultMapping and xml nodeType verbatim", () => {
    const source = {
      discriminator: {
        defaultMapping: "Dog",
        mapping: { dog: "#/components/schemas/Dog" },
        propertyName: "kind",
      },
      properties: { a: { xml: { nodeType: "text" } } },
      type: "object",
      xml: { nodeType: "attribute" },
    };
    const result = downgradeSchemaV32ToV31(asSchema(source));
    expect(result).toEqual(source);
    expect(result).not.toBe(source);
    expect(dig(result, "discriminator")).not.toBe(source.discriminator);
    expect(dig(result, "properties")).not.toBe(source.properties);
    expect(dig(result, "properties", "a")).not.toBe(source.properties.a);
    expect(dig(result, "properties", "a", "xml")).not.toBe(
      source.properties.a.xml
    );
    expect(dig(result, "xml")).not.toBe(source.xml);
  });

  it("clones subschema containers at every level", () => {
    const source = {
      allOf: [{ discriminator: { defaultMapping: "Dog" } }, true],
      items: { xml: { nodeType: "cdata" } },
    };
    const result = downgradeSchemaV32ToV31(asSchema(source));
    expect(result).toEqual(source);
    expect(dig(result, "allOf")).not.toBe(source.allOf);
    expect(dig(result, "allOf", "0")).not.toBe(source.allOf[0]);
    expect(dig(result, "items")).not.toBe(source.items);
  });

  it("keeps unknown schema keywords, validation keywords, and extensions unchanged", () => {
    expect(
      downgradeSchemaV32ToV31(
        asSchema({
          customKeyword: { nested: true },
          maximum: 5,
          type: "number",
          "x-note": "kept",
        })
      )
    ).toEqual({
      customKeyword: { nested: true },
      maximum: 5,
      type: "number",
      "x-note": "kept",
    });
  });

  it("passes boolean schemas through", () => {
    expect(downgradeSchemaV32ToV31(true)).toBe(true);
    expect(downgradeSchemaV32ToV31(false)).toBe(false);
  });

  it("passes junk schema input through", () => {
    expect(downgradeSchemaV32ToV31(asSchema("junk"))).toBe("junk");
    expect(downgradeSchemaV32ToV31(asSchema(null))).toBeNull();
    expect(
      downgradeSchemaV32ToV31(asSchema({ allOf: "junk", properties: 5 }))
    ).toEqual({ allOf: "junk", properties: 5 });
  });
});

describe("security schemes", () => {
  const convertSecuritySchemeComponent = (scheme: unknown): unknown =>
    dig(
      downgradeSpecV32ToV31(
        asSpec({
          components: { securitySchemes: { S: scheme } },
          openapi: "3.2.0",
        })
      ),
      "components",
      "securitySchemes",
      "S"
    );

  it("removes deprecated whatever its value", () => {
    expect(
      convertSecuritySchemeComponent({ deprecated: true, type: "http" })
    ).toEqual({ type: "http" });
    expect(
      convertSecuritySchemeComponent({ deprecated: false, type: "http" })
    ).toEqual({ type: "http" });
    expect(
      convertSecuritySchemeComponent({ deprecated: "yes", type: "http" })
    ).toEqual({ type: "http" });
  });

  it("removes oauth2MetadataUrl whatever its value", () => {
    expect(
      convertSecuritySchemeComponent({
        oauth2MetadataUrl: "https://example.com/meta",
        type: "oauth2",
      })
    ).toEqual({ type: "oauth2" });
    expect(
      convertSecuritySchemeComponent({ oauth2MetadataUrl: 42, type: "oauth2" })
    ).toEqual({ type: "oauth2" });
  });

  it("removes the deviceAuthorization flow and keeps other flows", () => {
    expect(
      convertSecuritySchemeComponent({
        flows: {
          authorizationCode: {
            authorizationUrl: "https://example.com/auth",
            scopes: {},
            tokenUrl: "https://example.com/token",
          },
          deviceAuthorization: {
            deviceAuthorizationUrl: "https://example.com/device",
            scopes: {},
            tokenUrl: "https://example.com/token",
          },
        },
        type: "oauth2",
      })
    ).toEqual({
      flows: {
        authorizationCode: {
          authorizationUrl: "https://example.com/auth",
          scopes: {},
          tokenUrl: "https://example.com/token",
        },
      },
      type: "oauth2",
    });
  });

  it("removes deviceAuthorization whatever its value", () => {
    expect(
      convertSecuritySchemeComponent({
        flows: { deviceAuthorization: "junk" },
        type: "oauth2",
      })
    ).toEqual({ flows: {}, type: "oauth2" });
  });

  it("clones malformed flows through", () => {
    expect(
      convertSecuritySchemeComponent({ flows: "junk", type: "oauth2" })
    ).toEqual({ flows: "junk", type: "oauth2" });
  });

  it("clones references in securitySchemes", () => {
    expect(
      convertSecuritySchemeComponent({
        $ref: "#/components/securitySchemes/Other",
      })
    ).toEqual({ $ref: "#/components/securitySchemes/Other" });
  });

  it("passes a non-object security scheme through", () => {
    expect(convertSecuritySchemeComponent("junk")).toBe("junk");
  });
});

describe("webhooks and components.pathItems", () => {
  it("converts webhook path items and removes their query operation", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        webhooks: {
          newPet: {
            post: { responses: { "200": { summary: "ok" } } },
            query: { description: "q" },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      webhooks: {
        newPet: {
          post: { responses: { "200": { description: "ok" } } },
        },
      },
    });
  });

  it("converts components.pathItems path items and removes their query operation", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          pathItems: {
            P: {
              get: { responses: {} },
              query: { description: "q" },
            },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { pathItems: { P: { get: { responses: {} } } } },
      openapi: "3.1.2",
    });
  });
});

describe("callbacks", () => {
  it("converts path items in operation-level callbacks and clones x- keys", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            post: {
              callbacks: {
                onEvent: {
                  "x-note": { query: { description: "kept" } },
                  "{$request.body#/url}": {
                    post: { responses: { "200": { summary: "ok" } } },
                    query: { description: "q" },
                  },
                },
                referenced: { $ref: "#/components/callbacks/C" },
              },
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          post: {
            callbacks: {
              onEvent: {
                "x-note": { query: { description: "kept" } },
                "{$request.body#/url}": {
                  post: { responses: { "200": { description: "ok" } } },
                },
              },
              referenced: { $ref: "#/components/callbacks/C" },
            },
            responses: {},
          },
        },
      },
    });
  });

  it("converts components.callbacks, handling both references and inline callbacks", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          callbacks: {
            inline: {
              "https://example.com/cb": {
                post: { responses: { "200": { summary: "ok" } } },
                query: { description: "q" },
              },
            },
            referenced: { $ref: "#/components/callbacks/inline" },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        callbacks: {
          inline: {
            "https://example.com/cb": {
              post: { responses: { "200": { description: "ok" } } },
            },
          },
          referenced: { $ref: "#/components/callbacks/inline" },
        },
      },
      openapi: "3.1.2",
    });
  });
});

describe("components maps", () => {
  it("handles references and inline objects across component maps", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          examples: {
            E: { dataValue: 1 },
            ERef: { $ref: "#/components/examples/E" },
          },
          headers: {
            H: { style: "cookie" },
            HRef: { $ref: "#/components/headers/H" },
          },
          parameters: {
            P: { in: "querystring", name: "q" },
            PRef: { $ref: "#/components/parameters/P" },
          },
          requestBodies: {
            B: {
              content: {
                "application/json": { itemSchema: { type: "string" } },
              },
            },
            BRef: { $ref: "#/components/requestBodies/B" },
          },
          responses: {
            R: { summary: "ok" },
            RRef: { $ref: "#/components/responses/R" },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        examples: {
          E: { value: 1 },
          ERef: { $ref: "#/components/examples/E" },
        },
        headers: {
          H: {},
          HRef: { $ref: "#/components/headers/H" },
        },
        parameters: {},
        requestBodies: {
          B: {
            content: {
              "application/json": {
                schema: { items: { type: "string" }, type: "array" },
              },
            },
          },
          BRef: { $ref: "#/components/requestBodies/B" },
        },
        responses: {
          R: { description: "ok" },
          RRef: { $ref: "#/components/responses/R" },
        },
      },
      openapi: "3.1.2",
    });
  });

  it("clones components.schemas entries unchanged, keeping 3.2 OAS vocabulary fields", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          schemas: {
            S: {
              discriminator: { defaultMapping: "Dog", propertyName: "kind" },
              xml: { nodeType: "attribute" },
            },
          },
        },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: {
        schemas: {
          S: {
            discriminator: { defaultMapping: "Dog", propertyName: "kind" },
            xml: { nodeType: "attribute" },
          },
        },
      },
      openapi: "3.1.2",
    });
  });

  it("clones unknown component keys and passes non-object components through", () => {
    const withUnknownKey = downgradeSpecV32ToV31(
      asSpec({
        components: { custom: { anything: true } },
        openapi: "3.2.0",
      })
    );
    expect(withUnknownKey).toEqual({
      components: { custom: { anything: true } },
      openapi: "3.1.2",
    });
    const withJunkComponents = downgradeSpecV32ToV31(
      asSpec({ components: "junk", openapi: "3.2.0" })
    );
    expect(withJunkComponents).toEqual({
      components: "junk",
      openapi: "3.1.2",
    });
  });
});

describe("extension and unknown key preservation", () => {
  it("preserves x- keys and unknown keys at the document, path item, and operation levels", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        futureKey: { anything: [1] },
        info: { title: "t", version: "1" },
        jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              operationId: "getA",
              responses: {},
              unknownOperationKey: 1,
              "x-op": true,
            },
            unknownPathItemKey: "kept",
            "x-item": [1, 2],
          },
        },
        security: [{ oauth: ["read"] }],
        "x-root": { deep: { value: 1 } },
      })
    );
    expect(result).toEqual({
      futureKey: { anything: [1] },
      info: { title: "t", version: "1" },
      jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            operationId: "getA",
            responses: {},
            unknownOperationKey: 1,
            "x-op": true,
          },
          unknownPathItemKey: "kept",
          "x-item": [1, 2],
        },
      },
      security: [{ oauth: ["read"] }],
      "x-root": { deep: { value: 1 } },
    });
  });
});

describe("input non-mutation", () => {
  it("never mutates the input document", () => {
    const spec = asSpec({
      $self: "https://example.com/api.json",
      components: {
        examples: { E: { dataValue: 1, serializedValue: "s" } },
        mediaTypes: {
          A: { $ref: "#/components/mediaTypes/B" },
          B: { itemSchema: { xml: { nodeType: "text" } } },
        },
        pathItems: { P: { query: { description: "q" } } },
        schemas: { S: { discriminator: { defaultMapping: "Dog" } } },
        securitySchemes: { O: { deprecated: true, type: "oauth2" } },
      },
      openapi: "3.2.0",
      paths: {
        "/a": {
          additionalOperations: { NOTIFY: { description: "n" } },
          get: {
            parameters: [{ in: "querystring", name: "q" }],
            requestBody: {
              content: {
                "application/json": { $ref: "#/components/mediaTypes/A" },
              },
            },
            responses: { "200": { summary: "ok" } },
          },
          query: { description: "q" },
          servers: [{ name: "s", url: "/u" }],
        },
      },
      servers: [{ name: "root", url: "https://example.com" }],
      tags: [{ kind: "nav", name: "t", parent: "p", summary: "s" }],
      webhooks: { hook: { query: { description: "wq" } } },
    });
    const snapshot = structuredClone(spec);
    downgradeSpecV32ToV31(spec);
    expect(spec).toEqual(snapshot);
  });

  it("never mutates the input schema", () => {
    const schema: OpenAPIV3_2.SchemaObject = {
      discriminator: { defaultMapping: "Dog", propertyName: "kind" },
      properties: { a: { xml: { nodeType: "attribute" } } },
      type: "object",
    };
    const snapshot = structuredClone(schema);
    downgradeSchemaV32ToV31(schema);
    expect(schema).toEqual(snapshot);
  });
});

describe("graceful handling of malformed nested objects", () => {
  it("clones malformed operations, request bodies, responses, media types, encodings, examples, and links", () => {
    const spec = asSpec({
      components: {
        examples: { junkExample: 42 },
        links: { junkLink: 42 },
      },
      openapi: "3.2.0",
      paths: {
        "/a": {
          get: "junk",
          post: {
            requestBody: {
              content: {
                "application/json": 42,
                "multipart/form-data": {
                  encoding: { field: "junk" },
                  example: 5,
                },
              },
            },
          },
          put: { requestBody: 42, responses: { "200": 42 } },
        },
      },
    });
    expect(downgradeSpecV32ToV31(spec)).toEqual({
      components: {
        examples: { junkExample: 42 },
        links: { junkLink: 42 },
      },
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: "junk",
          post: {
            requestBody: {
              content: {
                "application/json": 42,
                "multipart/form-data": {
                  encoding: { field: "junk" },
                  example: 5,
                },
              },
            },
          },
          put: { requestBody: 42, responses: { "200": 42 } },
        },
      },
    });
  });
});

describe("media type description", () => {
  it("removes the 3.2-only media type description and keeps other fields", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              responses: {
                "200": {
                  content: {
                    "application/json": {
                      description: "a JSON payload",
                      example: 5,
                      schema: { type: "integer" },
                    },
                  },
                  description: "ok",
                },
              },
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    example: 5,
                    schema: { type: "integer" },
                  },
                },
                description: "ok",
              },
            },
          },
        },
      },
    });
  });
});

describe("parameter allowReserved", () => {
  it("keeps allowReserved on query parameters and removes it elsewhere", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a/{id}": {
            parameters: [
              { allowReserved: true, in: "query", name: "q", schema: {} },
              {
                allowReserved: true,
                in: "path",
                name: "id",
                required: true,
                schema: {},
              },
              { allowReserved: true, in: "cookie", name: "c", schema: {} },
            ],
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a/{id}": {
          parameters: [
            { allowReserved: true, in: "query", name: "q", schema: {} },
            { in: "path", name: "id", required: true, schema: {} },
            { in: "cookie", name: "c", schema: {} },
          ],
        },
      },
    });
  });

  it("keeps allowReserved on objects without an in field", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { headers: { H: { allowReserved: true, schema: {} } } },
        openapi: "3.2.0",
      })
    );
    expect(result).toEqual({
      components: { headers: { H: { allowReserved: true, schema: {} } } },
      openapi: "3.1.2",
    });
  });
});

describe("references to removed querystring parameters", () => {
  it("removes list references to removed querystring component parameters and keeps others", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: {
            Keep: { in: "query", name: "k", schema: {} },
            QS: {
              content: { "application/x-www-form-urlencoded": { schema: {} } },
              in: "querystring",
              name: "filter",
            },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                { $ref: "#/components/parameters/QS" },
                { $ref: "#/components/parameters/Keep" },
              ],
              responses: {},
            },
            parameters: [{ $ref: "#/components/parameters/QS" }],
          },
        },
      })
    );
    expect(result).toEqual({
      components: {
        parameters: { Keep: { in: "query", name: "k", schema: {} } },
      },
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [{ $ref: "#/components/parameters/Keep" }],
            responses: {},
          },
          parameters: [],
        },
      },
    });
  });
});

describe("malformed content maps", () => {
  it("clones a non-object content value through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": { post: { requestBody: { content: "junk" }, responses: {} } },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": { post: { requestBody: { content: "junk" }, responses: {} } },
      },
    });
  });
});

describe("parameters and headers losing their entire content", () => {
  it("removes a parameter whose only content entry could not be inlined", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                {
                  content: {
                    "application/json": {
                      $ref: "#/components/mediaTypes/Missing",
                    },
                  },
                  in: "query",
                  name: "q",
                },
                { in: "query", name: "keep", schema: {} },
              ],
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [{ in: "query", name: "keep", schema: {} }],
            responses: {},
          },
        },
      },
    });
  });

  it("keeps a parameter when part of its content could be inlined", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: { mediaTypes: { Known: { example: 1 } } },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                {
                  content: {
                    "application/json": {
                      $ref: "#/components/mediaTypes/Missing",
                    },
                    "application/xml": {
                      $ref: "#/components/mediaTypes/Known",
                    },
                  },
                  in: "query",
                  name: "q",
                },
              ],
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {},
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [
              {
                content: { "application/xml": { example: 1 } },
                in: "query",
                name: "q",
              },
            ],
            responses: {},
          },
        },
      },
    });
  });

  it("removes headers and component parameters whose entire content could not be inlined", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          headers: {
            Broken: {
              content: {
                "text/plain": { $ref: "#/components/mediaTypes/Missing" },
              },
            },
            Keep: { schema: {} },
          },
          parameters: {
            Broken: {
              content: {
                "text/plain": { $ref: "#/components/mediaTypes/Missing" },
              },
              in: "query",
              name: "q",
            },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              responses: {
                "200": {
                  description: "ok",
                  headers: {
                    "X-Broken": {
                      content: {
                        "text/plain": {
                          $ref: "#/components/mediaTypes/Missing",
                        },
                      },
                    },
                    "X-Keep": { schema: {} },
                  },
                },
              },
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {
        headers: { Keep: { schema: {} } },
        parameters: {},
      },
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            responses: {
              "200": {
                description: "ok",
                headers: { "X-Keep": { schema: {} } },
              },
            },
          },
        },
      },
    });
  });
});

describe("querystring reference alias chains", () => {
  it("removes aliases of removed querystring parameters and references to them", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          parameters: {
            Alias: { $ref: "#/components/parameters/Qs" },
            AliasOfAlias: { $ref: "#/components/parameters/Alias" },
            Keep: { in: "query", name: "k", schema: {} },
            Qs: {
              content: { "application/x-www-form-urlencoded": { schema: {} } },
              in: "querystring",
              name: "filter",
            },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                { $ref: "#/components/parameters/AliasOfAlias" },
                { $ref: "#/components/parameters/Keep" },
              ],
              responses: {},
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: {
        parameters: { Keep: { in: "query", name: "k", schema: {} } },
      },
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [{ $ref: "#/components/parameters/Keep" }],
            responses: {},
          },
        },
      },
    });
  });
});

describe("deep documents", () => {
  it("converts deeply nested schemas without throwing", () => {
    let deep = asSchema({ type: "string" });
    for (let index = 0; index < 1000; index += 1) {
      deep = asSchema({ items: deep, type: "array" });
    }
    expect(() => downgradeSchemaV32ToV31(deep)).not.toThrow();
  });
});

describe("malformed header maps", () => {
  it("clones a non-object headers value through", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              responses: { "200": { description: "ok", headers: "junk" } },
            },
          },
        },
      })
    );
    expect(result).toEqual({
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            responses: { "200": { description: "ok", headers: "junk" } },
          },
        },
      },
    });
  });
});

describe("cyclic input", () => {
  it("converts a path item that cycles through its callbacks without throwing", () => {
    const callback: UnknownRecord = {};
    const pathItem: UnknownRecord = {
      get: { callbacks: { cb: callback }, responses: {} },
    };
    callback.expr = pathItem;
    expect(() =>
      downgradeSpecV32ToV31(
        asSpec({ openapi: "3.2.0", paths: { "/a": pathItem } })
      )
    ).not.toThrow();
  });
});

describe("references to components removed for uninlinable content", () => {
  it("removes parameter and header references whose targets lost their entire content", () => {
    const result = downgradeSpecV32ToV31(
      asSpec({
        components: {
          headers: {
            Broken: {
              content: {
                "text/plain": { $ref: "#/components/mediaTypes/Loop" },
              },
            },
            BrokenAlias: { $ref: "#/components/headers/Broken" },
          },
          mediaTypes: { Loop: { $ref: "#/components/mediaTypes/Loop" } },
          parameters: {
            Broken: {
              content: {
                "text/plain": { $ref: "#/components/mediaTypes/Missing" },
              },
              in: "query",
              name: "q",
            },
            BrokenAlias: { $ref: "#/components/parameters/Broken" },
          },
        },
        openapi: "3.2.0",
        paths: {
          "/a": {
            get: {
              parameters: [
                { $ref: "#/components/parameters/Broken" },
                { $ref: "#/components/parameters/BrokenAlias" },
              ],
              responses: {
                "200": {
                  description: "ok",
                  headers: {
                    "X-Broken": { $ref: "#/components/headers/Broken" },
                    "X-BrokenAlias": {
                      $ref: "#/components/headers/BrokenAlias",
                    },
                  },
                },
              },
            },
          },
        },
      })
    );
    expect(result).toEqual({
      components: { headers: {}, parameters: {} },
      openapi: "3.1.2",
      paths: {
        "/a": {
          get: {
            parameters: [],
            responses: { "200": { description: "ok", headers: {} } },
          },
        },
      },
    });
  });
});
