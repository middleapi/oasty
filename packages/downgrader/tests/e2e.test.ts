import type { OpenAPIV3_1, OpenAPIV3_2 } from "@oasty/types";
/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-object-parameters, anti-slop/no-unsafe-dictionary-type -- these e2e tests shuttle whole OpenAPI documents across three spec versions into the converters and a generic JSON-schema validator, so version-agnostic document shapes are the domain contract */
import { Validator } from "@seriousme/openapi-schema-validator";

import { doc as queryExample } from "../../types/tests/examples/3-2-query-example";
import { doc as tagsExample } from "../../types/tests/examples/3-2-tags-example";
import { doc as nonOauthScopes } from "../../types/tests/examples/non-oauth-scopes-3-1";
import { doc as petstore } from "../../types/tests/examples/petstore-3-0";
import { doc as tictactoe } from "../../types/tests/examples/tictactoe-3-1";
import { doc as webhookExample } from "../../types/tests/examples/webhook-example-3-1";
import { doc as mega31 } from "../../types/tests/schema-tests-3.1/mega";
import { doc as mega32 } from "../../types/tests/schema-tests-3.2/mega";
import { downgradeSpecV31ToV30, downgradeSpecV32ToV31 } from "../src/index";

const asSpec31 = (value: unknown): OpenAPIV3_1.OpenAPIObject =>
  // SAFETY: tests deliberately feed documents of other versions (and fixture literals whose inferred unions do not narrow) to exercise real converter input.
  value as OpenAPIV3_1.OpenAPIObject;

const asValidatorInput = (value: unknown): Record<string, unknown> =>
  // SAFETY: the validator accepts arbitrary JSON documents at runtime.
  value as Record<string, unknown>;

const validate = async (spec: object) => {
  const validator = new Validator();
  const result = await validator.validate(
    asValidatorInput(structuredClone(spec))
  );
  return { result, version: validator.version };
};

const expectValidAs = async (
  spec: object,
  expectedVersion: string
): Promise<void> => {
  const { result, version } = await validate(spec);
  expect(result.errors ?? []).toEqual([]);
  expect(result.valid).toBe(true);
  expect(version).toBe(expectedVersion);
};

describe("3.1 example documents downgraded to 3.0", () => {
  it("converts the tictactoe example to a valid 3.0.4 document without mutating the input", async () => {
    const before = structuredClone(tictactoe);
    const converted = downgradeSpecV31ToV30(asSpec31(tictactoe));
    expect(converted.openapi).toBe("3.0.4");
    await expectValidAs(converted, "3.0");
    expect(converted).toMatchSnapshot();
    expect(tictactoe).toEqual(before);
  });

  it("converts the webhook example, removing webhooks and synthesizing empty paths", async () => {
    const before = structuredClone(webhookExample);
    const converted = downgradeSpecV31ToV30(webhookExample);
    expect(converted.openapi).toBe("3.0.4");
    expect(converted).not.toHaveProperty("webhooks");
    expect(converted).not.toHaveProperty("x-webhooks");
    expect(converted.paths).toEqual({});
    expect(converted.components).toHaveProperty(["schemas", "Pet"]);
    await expectValidAs(converted, "3.0");
    expect(converted).toMatchSnapshot();
    expect(webhookExample).toEqual(before);
  });

  it("converts the non-OAuth-scopes example, emptying roles on the non-OAuth scheme", async () => {
    const before = structuredClone(nonOauthScopes);
    const converted = downgradeSpecV31ToV30(nonOauthScopes);
    expect(converted.openapi).toBe("3.0.4");
    expect(converted.paths).toMatchObject({
      "/users": { get: { security: [{ bearerAuth: [] }] } },
    });
    // The source operation has no responses; the synthesized minimal default
    // response keeps the document valid.
    expect(converted.paths?.["/users"]?.get?.responses).toEqual({
      default: { description: "" },
    });
    await expectValidAs(converted, "3.0");
    expect(converted).toMatchSnapshot();
    expect(nonOauthScopes).toEqual(before);
  });

  it("converts the 3.1 mega document, removing 3.1-only constructs and the mutualTLS scheme", async () => {
    const before = structuredClone(mega31);
    const converted = downgradeSpecV31ToV30(mega31);
    expect(converted.openapi).toBe("3.0.4");
    expect(converted).not.toHaveProperty("webhooks");
    expect(converted).not.toHaveProperty("x-webhooks");
    expect(converted.info).toEqual({
      license: { name: "Apache 2.0" },
      title: "My API",
      version: "1.0.0",
    });
    expect(converted.components).not.toHaveProperty("pathItems");
    expect(converted.components).not.toHaveProperty("x-pathItems");
    expect(converted.components?.securitySchemes).toEqual({});
    // The only reference into components.pathItems lived in the removed
    // webhooks, so no trace of the reusable path items remains.
    expect(JSON.stringify(converted)).not.toContain("#/components/pathItems/");
    await expectValidAs(converted, "3.0");
    expect(converted).toMatchSnapshot();
    expect(mega31).toEqual(before);
  });

  it("leaves $refs into the removed components.pathItems untouched, letting them dangle", () => {
    const doc = asSpec31({
      components: {
        pathItems: {
          shared: {
            get: { responses: { "200": { description: "ok" } } },
          },
        },
      },
      info: { title: "Dangling", version: "1.0.0" },
      openapi: "3.1.0",
      paths: {
        "/shared": { $ref: "#/components/pathItems/shared" },
      },
    });
    const before = structuredClone(doc);
    const converted = downgradeSpecV31ToV30(doc);
    expect(converted.components).not.toHaveProperty("pathItems");
    // Documented limitation: the reference is passed through untouched and
    // now dangles, so the (reference-resolving) validator is not consulted.
    expect(converted.paths?.["/shared"]).toEqual({
      $ref: "#/components/pathItems/shared",
    });
    expect(doc).toEqual(before);
  });

  it("clones a discriminator with defaultMapping as-is into the 3.0 document", async () => {
    const doc = asSpec31({
      components: {
        schemas: {
          Cat: {
            properties: { kind: { type: "string" } },
            required: ["kind"],
            type: "object",
          },
          Pet: {
            discriminator: {
              defaultMapping: "Cat",
              mapping: { cat: "#/components/schemas/Cat" },
              propertyName: "kind",
            },
            oneOf: [{ $ref: "#/components/schemas/Cat" }],
          },
        },
      },
      info: { title: "Discriminated", version: "1.0.0" },
      openapi: "3.1.0",
      paths: {},
    });
    const before = structuredClone(doc);
    const converted = downgradeSpecV31ToV30(doc);
    // defaultMapping is not a schema keyword the 3.0 converter touches, and
    // the official 3.0 schema allows extra discriminator fields.
    expect(converted).toHaveProperty(
      ["components", "schemas", "Pet", "discriminator"],
      {
        defaultMapping: "Cat",
        mapping: { cat: "#/components/schemas/Cat" },
        propertyName: "kind",
      }
    );
    await expectValidAs(converted, "3.0");
    expect(doc).toEqual(before);
  });
});

describe("3.2 example documents downgraded to 3.1 and chained to 3.0", () => {
  it("removes the query operation of the query example, leaving an empty path item", async () => {
    const before = structuredClone(queryExample);
    const v31 = downgradeSpecV32ToV31(queryExample);
    expect(v31.openapi).toBe("3.1.2");
    // The QUERY operation has no 3.1 equivalent; an empty Path Item Object
    // is legal in both 3.1 and 3.0.
    expect(v31.paths?.["/flights/search"]).toEqual({});
    expect(JSON.stringify(v31)).not.toContain("x-additionalOperations");
    await expectValidAs(v31, "3.1");
    expect(v31).toMatchSnapshot("v3.1");

    const v30 = downgradeSpecV31ToV30(v31);
    expect(v30.openapi).toBe("3.0.4");
    await expectValidAs(v30, "3.0");
    expect(v30).toMatchSnapshot("v3.0");
    expect(queryExample).toEqual(before);
  });

  it("removes tag summary, parent, and kind of the tags example", async () => {
    const before = structuredClone(tagsExample);
    const v31 = downgradeSpecV32ToV31(tagsExample);
    expect(v31.openapi).toBe("3.1.2");
    expect(v31.tags).toEqual([
      { description: "Core flight operations", name: "flights" },
      {
        description: "Flights that cross country borders",
        name: "international",
      },
      { description: "Flights within a single country", name: "domestic" },
      {
        description: "Information about flight delays",
        externalDocs: {
          description: "Delay compensation policies",
          url: "https://docs.example.com/delay-policies",
        },
        name: "delays",
      },
    ]);
    await expectValidAs(v31, "3.1");
    expect(v31).toMatchSnapshot("v3.1");

    const v30 = downgradeSpecV31ToV30(v31);
    expect(v30.openapi).toBe("3.0.4");
    await expectValidAs(v30, "3.0");
    expect(v30).toMatchSnapshot("v3.0");
    expect(tagsExample).toEqual(before);
  });

  it("converts the 3.2 mega document, preserving the discriminator defaultMapping in the schema", async () => {
    const before = structuredClone(mega32);
    const v31 = downgradeSpecV32ToV31(mega32);
    expect(v31.openapi).toBe("3.1.2");
    const megaDiscriminatorPath = [
      "components",
      "pathItems",
      "myPathItem",
      "post",
      "requestBody",
      "content",
      "application/json",
      "schema",
      "discriminator",
    ];
    // Schema Objects pass through unchanged in 3.2 -> 3.1, so the 3.2-only
    // discriminator defaultMapping survives as an extra JSON Schema keyword.
    expect(v31).toHaveProperty(
      [...megaDiscriminatorPath, "defaultMapping"],
      "Bar"
    );
    expect(v31).toHaveProperty(
      [...megaDiscriminatorPath, "propertyName"],
      "type"
    );
    expect(v31).not.toHaveProperty([
      ...megaDiscriminatorPath,
      "x-defaultMapping",
    ]);
    await expectValidAs(v31, "3.1");
    expect(v31).toMatchSnapshot("v3.1");

    const v30 = downgradeSpecV31ToV30(v31);
    expect(v30.openapi).toBe("3.0.4");
    // The discriminator lives in components.pathItems, which 3.0 cannot
    // express, so it disappears together with its host in this hop.
    expect(v30.components).not.toHaveProperty("pathItems");
    expect(v30).not.toHaveProperty("webhooks");
    await expectValidAs(v30, "3.0");
    expect(v30).toMatchSnapshot("v3.0");
    expect(mega32).toEqual(before);
  });
});

describe("already-3.0-shaped documents", () => {
  it("passes the petstore example through untouched apart from the version stamp", () => {
    const before = structuredClone(petstore);
    const converted = downgradeSpecV31ToV30(asSpec31(petstore));
    expect(converted).toEqual({
      ...structuredClone(petstore),
      openapi: "3.0.4",
    });
    expect(petstore).toEqual(before);
  });
});

describe("kitchen-sink 3.2 document chained down to 3.0", () => {
  const kitchenSink = {
    $self: "https://api.example.com/openapi.json",
    components: {
      mediaTypes: {
        JsonPayload: {
          schema: { items: { type: "string" }, type: "array" },
        },
      },
      parameters: {
        filter: {
          content: {
            "application/json": {
              schema: {
                properties: { term: { type: "string" } },
                type: "object",
              },
            },
          },
          in: "querystring",
          name: "filter",
        },
        page: { in: "query", name: "page", schema: { type: "integer" } },
      },
      securitySchemes: {
        deviceAuth: {
          deprecated: true,
          flows: {
            deviceAuthorization: {
              deviceAuthorizationUrl: "https://auth.example.com/device",
              scopes: { "events:read": "Read events" },
              tokenUrl: "https://auth.example.com/token",
            },
          },
          oauth2MetadataUrl: "https://auth.example.com/.well-known/oauth",
          type: "oauth2",
        },
      },
    },
    info: { title: "Kitchen Sink", version: "1.0.0" },
    openapi: "3.2.0",
    paths: {
      "/events": {
        get: {
          operationId: "streamEvents",
          responses: {
            "200": {
              content: {
                "application/json": {
                  itemSchema: { type: "object" },
                  schema: { items: { type: "object" }, type: "array" },
                },
                "application/jsonl": {
                  itemSchema: {
                    properties: { kind: { type: "string" } },
                    type: "object",
                  },
                },
              },
              summary: "Event stream",
            },
            "204": {},
          },
        },
      },
      "/search": {
        get: {
          operationId: "searchEvents",
          parameters: [
            {
              content: {
                "application/json": {
                  schema: {
                    properties: { term: { type: "string" } },
                    type: "object",
                  },
                },
              },
              in: "querystring",
              name: "filter",
            },
            {
              examples: {
                kept: { serializedValue: "sid=1", value: "sid=1" },
                linked: {
                  dataValue: { sid: 2 },
                  externalValue: "https://example.com/session.json",
                },
                promoted: { dataValue: "sid=3" },
              },
              in: "cookie",
              name: "session",
              schema: { type: "string" },
              style: "cookie",
            },
          ],
          responses: {
            "200": {
              content: {
                "application/json": {
                  $ref: "#/components/mediaTypes/JsonPayload",
                },
              },
              description: "Search results",
              summary: "Results",
            },
          },
        },
      },
    },
    security: [{ deviceAuth: ["events:read"] }],
    servers: [{ name: "production", url: "https://api.example.com" }],
  } satisfies OpenAPIV3_2.OpenAPIObject;

  it("converts every 3.2-only construct and stays valid through both hops", async () => {
    const before = structuredClone(kitchenSink);

    const v31 = downgradeSpecV32ToV31(kitchenSink);
    expect(v31.openapi).toBe("3.1.2");
    expect(v31).not.toHaveProperty("$self");
    expect(v31).not.toHaveProperty("x-self");
    expect(v31.servers).toEqual([{ url: "https://api.example.com" }]);
    expect(v31.components).not.toHaveProperty("mediaTypes");
    expect(JSON.stringify(v31)).not.toContain("#/components/mediaTypes/");
    // The querystring component is removed outright; the deviceAuthorization
    // flow, oauth2MetadataUrl, and deprecated have no 3.1 equivalent either.
    expect(v31.components?.parameters).toEqual({
      page: { in: "query", name: "page", schema: { type: "integer" } },
    });
    expect(v31.components?.securitySchemes).toEqual({
      deviceAuth: { flows: {}, type: "oauth2" },
    });
    expect(v31.paths?.["/events"]?.get?.responses).toEqual({
      "200": {
        content: {
          "application/json": {
            schema: { items: { type: "object" }, type: "array" },
          },
          "application/jsonl": {
            schema: {
              items: {
                properties: { kind: { type: "string" } },
                type: "object",
              },
              type: "array",
            },
          },
        },
        description: "Event stream",
      },
      "204": { description: "" },
    });
    // The querystring parameter is removed from the list; the cookie style
    // is removed from the remaining parameter, and its examples promote
    // dataValue/serializedValue into free value slots only.
    expect(v31.paths?.["/search"]?.get?.parameters).toEqual([
      {
        examples: {
          kept: { value: "sid=1" },
          linked: { externalValue: "https://example.com/session.json" },
          promoted: { value: "sid=3" },
        },
        in: "cookie",
        name: "session",
        schema: { type: "string" },
      },
    ]);
    expect(v31.paths?.["/search"]?.get?.responses?.["200"]).toEqual({
      content: {
        "application/json": {
          schema: { items: { type: "string" }, type: "array" },
        },
      },
      description: "Search results",
    });
    expect(v31.security).toEqual([{ deviceAuth: ["events:read"] }]);
    await expectValidAs(v31, "3.1");
    expect(v31).toMatchSnapshot("v3.1");

    const v30 = downgradeSpecV31ToV30(v31);
    expect(v30.openapi).toBe("3.0.4");
    await expectValidAs(v30, "3.0");
    expect(v30).toMatchSnapshot("v3.0");

    expect(kitchenSink).toEqual(before);
  });
});
