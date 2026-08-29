import type { OpenAPIObject, PathItemObject, SchemaObject } from "./v3.1";

export const webhooksOnly = {
  components: {
    pathItems: {
      petWebhook: {
        post: { responses: { "200": { description: "OK" } } },
      },
    },
    schemas: {
      Animal: {
        discriminator: {
          mapping: { pet: "Pet" },
          propertyName: "petType",
          "x-extension": "allowed in 3.1",
        },
        oneOf: [
          {
            $ref: "#/components/schemas/Pet",
            description: "sibling keywords allowed",
          },
          { type: "string" },
        ],
      },
      Pet: {
        $defs: {
          item: {
            $dynamicAnchor: "item",
            type: "string",
          },
        },
        $id: "https://example.com/schemas/pet",
        $schema: "https://spec.openapis.org/oas/3.1/dialect/base",
        deprecated: false,
        example: { id: 1, name: "Rex" },
        examples: [{ id: 1, name: "Rex" }],
        properties: {
          anything: true,
          avatar: {
            contentEncoding: "base64",
            contentMediaType: "image/png",
            type: "string",
          },
          conditional: {
            else: { required: ["bField"] },
            if: { properties: { kind: { const: "a" } } },
            // oxlint-disable-next-line unicorn/no-thenable -- `then` is a JSON Schema keyword
            then: { required: ["aField"] },
          },
          config: {
            additionalProperties: { type: "string" },
            dependentRequired: { credit: ["billing"] },
            dependentSchemas: {
              credit: { required: ["billing"] },
            },
            propertyNames: { pattern: "^[a-z]+$" },
            type: "object",
            unevaluatedProperties: false,
          },
          coordinates: {
            contains: { type: "number" },
            items: false,
            minContains: 1,
            prefixItems: [{ type: "number" }, { type: "number" }],
            type: "array",
          },
          dynamic: { $dynamicRef: "#item" },
          id: { format: "int64", type: "integer" },
          name: { type: "string" },
          nothing: false,
          nullable: { type: "null" },
          score: {
            exclusiveMaximum: 10,
            exclusiveMinimum: 0,
            type: "number",
          },
          status: { const: "available" },
          tag: { type: ["string", "null"] },
        },
        required: ["id", "name"],
        type: "object",
        "unprefixed-extension": { anything: "goes" },
        "x-prefixed-extension": true,
      },
    },
    securitySchemes: {
      mtls: { description: "Client certificate", type: "mutualTLS" },
    },
  },
  info: {
    license: { identifier: "MIT", name: "MIT" },
    summary: "A webhook-only API description",
    title: "Webhook Example",
    version: "1.0.0",
  },
  jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
  openapi: "3.1.2",
  security: [{ mtls: ["admin-role"] }],
  webhooks: {
    newPet: {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Pet" },
            },
          },
          description: "Information about a new pet",
        },
        responses: {
          "200": { description: "Webhook processed" },
        },
      },
    },
    referenced: { $ref: "#/components/pathItems/petWebhook" },
  },
} satisfies OpenAPIObject;

export const referenceOverrides = {
  info: { title: "API", version: "1.0.0" },
  openapi: "3.1.0",
  paths: {
    "/pets": {
      get: {
        // `responses` is no longer REQUIRED in 3.1.
        parameters: [
          {
            $ref: "#/components/parameters/limit",
            description: "Overridden description",
            summary: "Overridden summary",
          },
        ],
      },
    },
  },
} satisfies OpenAPIObject;

export const wrongVersion = {
  info: { title: "API", version: "1.0.0" },
  // @ts-expect-error: The `openapi` version string must be within the 3.1 line.
  openapi: "3.0.4",
  paths: {},
} satisfies OpenAPIObject;

// Boolean schemas are valid Schema Objects in OpenAPI 3.1.
export const booleanSchema = true satisfies SchemaObject;

export const numericExclusiveBounds = {
  // @ts-expect-error: `exclusiveMaximum` is a number in OpenAPI 3.1, not a 3.0-style boolean.
  exclusiveMaximum: true,
  type: "number",
} satisfies SchemaObject;

export const noQueryMethod = {
  // @ts-expect-error: The QUERY method does not exist before OpenAPI 3.2.
  query: { responses: { "200": { description: "OK" } } },
} satisfies PathItemObject;

export const noAdditionalOperations = {
  // @ts-expect-error: `additionalOperations` does not exist before OpenAPI 3.2.
  additionalOperations: {},
} satisfies PathItemObject;

export const typedSchema = {
  const: "fixed",
  default: "fixed",
  examples: ["fixed"],
  type: "string",
} satisfies SchemaObject<string>;

export const typedSchemaMismatch = {
  // @ts-expect-error: `examples` entries must match the schema's data type parameter.
  examples: [1],
  type: "string",
} satisfies SchemaObject<string>;
