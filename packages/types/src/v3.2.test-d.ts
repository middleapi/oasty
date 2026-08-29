import type { OpenAPIObject, SchemaObject } from "./v3.2";

export const streamingApi = {
  $self: "https://example.com/openapi",
  components: {
    examples: {
      external: {
        dataValue: { kind: "cat" },
        externalValue: "https://example.com/examples/cat.bin",
      },
      serialized: {
        dataValue: { kind: "cat" },
        serializedValue: "kind=cat",
        summary: "A serialized example",
      },
    },
    mediaTypes: {
      EventStream: {
        itemSchema: { $ref: "#/components/schemas/Event" },
      },
      Referenced: { $ref: "#/components/mediaTypes/EventStream" },
    },
    responses: {
      Uploaded: {
        description: "The upload was accepted",
        summary: "Upload accepted",
      },
    },
    schemas: {
      Cat: { type: "object" },
      Event: {
        properties: {
          animal: {
            discriminator: {
              defaultMapping: "Cat",
              mapping: { cat: "Cat" },
              propertyName: "kind",
            },
            oneOf: [{ $ref: "#/components/schemas/Cat" }, { type: "object" }],
          },
          payload: {
            properties: {
              body: { type: "string", xml: { nodeType: "cdata" } },
              id: { type: "string", xml: { nodeType: "attribute" } },
              legacyAttribute: { type: "string", xml: { attribute: true } },
              legacyWrapped: {
                items: { type: "string" },
                type: "array",
                xml: { wrapped: true },
              },
              note: { type: "string", xml: { nodeType: "text" } },
            },
            type: "object",
            xml: {
              name: "payload",
              namespace: "https://example.com/ns",
              nodeType: "element",
              prefix: "ex",
            },
          },
        },
        type: "object",
      },
      EventQuery: { type: "object" },
    },
    securitySchemes: {
      device: {
        deprecated: false,
        flows: {
          authorizationCode: {
            authorizationUrl: "https://auth.example.com/authorize",
            scopes: {},
            tokenUrl: "https://auth.example.com/token",
          },
          deviceAuthorization: {
            deviceAuthorizationUrl: "https://auth.example.com/device",
            scopes: { "read:events": "read events" },
            tokenUrl: "https://auth.example.com/token",
          },
        },
        oauth2MetadataUrl:
          "https://auth.example.com/.well-known/oauth-authorization-server",
        type: "oauth2",
      },
      legacy: {
        deprecated: true,
        scheme: "basic",
        type: "http",
      },
    },
  },
  info: { title: "Streaming API", version: "2.0.0" },
  openapi: "3.2.0",
  paths: {
    "/events": {
      additionalOperations: {
        COPY: {
          responses: { "204": {} },
          summary: "Copy the event stream configuration",
        },
      },
      get: {
        parameters: [
          {
            content: {
              "application/x-www-form-urlencoded": {
                schema: {
                  properties: { kind: { type: "string" } },
                  type: "object",
                },
              },
            },
            in: "querystring",
            name: "filter",
          },
          {
            explode: false,
            in: "cookie",
            name: "session",
            schema: { type: "string" },
            style: "cookie",
          },
        ],
        responses: {
          "200": {
            content: {
              "text/event-stream": {
                itemSchema: {
                  properties: {
                    data: {
                      contentMediaType: "application/json",
                      contentSchema: { $ref: "#/components/schemas/Event" },
                      type: "string",
                    },
                    event: { type: "string" },
                    retry: { type: "integer" },
                  },
                  type: "object",
                },
              },
            },
            summary: "Event stream",
          },
        },
        summary: "Subscribe to events",
      },
      query: {
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EventQuery" },
            },
          },
        },
        responses: {
          "200": { description: "Query results" },
        },
        summary: "Complex event query using the QUERY method",
      },
    },
    "/uploads": {
      post: {
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              encoding: {
                nested: {
                  contentType: "application/json",
                  encoding: {
                    inner: { explode: true, style: "form" },
                  },
                  itemEncoding: { contentType: "text/plain" },
                  prefixEncoding: [{ contentType: "text/plain" }],
                },
              },
              schema: { type: "object" },
            },
            "multipart/form-data": {
              prefixEncoding: [
                { contentType: "text/plain" },
                {
                  contentType: "image/png",
                  headers: {
                    "X-Part-Id": { schema: { type: "string" } },
                  },
                },
              ],
              schema: {
                prefixItems: [
                  { type: "string" },
                  { contentEncoding: "base64", type: "string" },
                ],
                type: "array",
              },
            },
            "multipart/mixed": {
              itemEncoding: { contentType: "application/octet-stream" },
              itemSchema: { contentEncoding: "base64", type: "string" },
            },
          },
        },
        responses: {
          default: { $ref: "#/components/responses/Uploaded" },
        },
      },
    },
  },
  security: [{ "./device": ["read:events"] }],
  servers: [
    {
      description: "Production server",
      name: "production",
      url: "https://api.example.com",
    },
  ],
  tags: [
    { kind: "nav", name: "events", summary: "Events" },
    { kind: "badge", name: "streaming", parent: "events" },
  ],
} satisfies OpenAPIObject;

export const wrongVersion = {
  info: { title: "API", version: "1.0.0" },
  // @ts-expect-error: The `openapi` version string must be within the 3.2 line.
  openapi: "3.1.2",
  paths: {},
} satisfies OpenAPIObject;

export const typedSchema = {
  const: "fixed",
  default: "fixed",
  examples: ["fixed"],
  type: "string",
} satisfies SchemaObject<string>;

export const typedSchemaMismatch = {
  // @ts-expect-error: `const` must match the schema's data type parameter.
  const: 1,
  type: "string",
} satisfies SchemaObject<string>;
