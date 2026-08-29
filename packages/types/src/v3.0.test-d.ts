import type {
  OpenAPIObject,
  ReferenceObject,
  ResponsesObject,
  SchemaObject,
  SecuritySchemeObject,
} from "./v3.0";

export const petstore = {
  components: {
    callbacks: {
      onPetStatusChange: {
        "{$request.body#/callbackUrl}": {
          post: { responses: { "200": { description: "OK" } } },
        },
      },
    },
    examples: {
      tags: { summary: "Example tags", value: ["dog", "cat"] },
    },
    headers: {
      next: {
        description: "Link to the next page",
        schema: { type: "string" },
      },
    },
    links: {
      next: { operationRef: "#/paths/~1pets/get" },
    },
    parameters: {
      sessionCookie: {
        content: {
          "text/plain": { schema: { type: "string" } },
        },
        in: "cookie",
        name: "session",
      },
      traceId: {
        in: "header",
        name: "X-Trace-Id",
        schema: { type: "string" },
      },
    },
    requestBodies: {
      PetBody: {
        content: {
          "application/x-www-form-urlencoded": {
            schema: { type: "object" },
          },
        },
      },
    },
    responses: {
      Error: {
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Pet" } },
        },
        description: "An error occurred",
      },
    },
    schemas: {
      Animal: {
        discriminator: {
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "Dog",
          },
          propertyName: "petType",
        },
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
      },
      AnyOfExample: {
        anyOf: [{ pattern: "^[a-z]+$", type: "string" }, { type: "integer" }],
      },
      Cat: { type: "object" },
      Dog: { type: "object" },
      NewPet: {
        allOf: [
          { $ref: "#/components/schemas/Pet" },
          { properties: { name: { type: "string" } }, type: "object" },
        ],
      },
      Pet: {
        additionalProperties: false,
        description: "A pet",
        externalDocs: { url: "https://example.com/pet" },
        properties: {
          attributes: {
            additionalProperties: { type: "string" },
            maxProperties: 20,
            minProperties: 0,
            type: "object",
            xml: { name: "attribute", wrapped: false },
          },
          friends: {
            items: { $ref: "#/components/schemas/Pet" },
            maxItems: 10,
            minItems: 0,
            type: "array",
            uniqueItems: true,
          },
          id: { format: "int64", readOnly: true, type: "integer" },
          legacy: { deprecated: true, not: { type: "string" } },
          name: { maxLength: 100, minLength: 1, type: "string" },
          score: {
            exclusiveMaximum: true,
            exclusiveMinimum: false,
            maximum: 10,
            minimum: 0,
            multipleOf: 0.5,
            type: "number",
          },
          secret: { type: "string", writeOnly: true },
          status: {
            default: "available",
            enum: ["available", "pending", "sold"],
            example: "available",
            type: "string",
          },
          tag: { nullable: true, type: "string" },
        },
        required: ["id", "name"],
        title: "Pet",
        type: "object",
        "x-schema-extension": true,
        xml: {
          name: "pet",
          namespace: "https://example.com/schema",
          prefix: "p",
        },
      },
    },
    securitySchemes: {
      apiKey: {
        description: "API key auth",
        in: "header",
        name: "api_key",
        type: "apiKey",
      },
      basicAuth: { scheme: "basic", type: "http" },
      bearerAuth: { bearerFormat: "JWT", scheme: "bearer", type: "http" },
      oidc: {
        openIdConnectUrl:
          "https://example.com/.well-known/openid-configuration",
        type: "openIdConnect",
      },
      petstoreAuth: {
        flows: {
          authorizationCode: {
            authorizationUrl: "https://example.com/authorize",
            scopes: { "write:pets": "modify pets" },
            tokenUrl: "https://example.com/token",
          },
          clientCredentials: {
            refreshUrl: "https://example.com/refresh",
            scopes: {},
            tokenUrl: "https://example.com/token",
          },
          implicit: {
            authorizationUrl: "https://example.com/authorize",
            scopes: { "read:pets": "read your pets" },
          },
          password: {
            scopes: {},
            tokenUrl: "https://example.com/token",
          },
        },
        type: "oauth2",
      },
      referenced: { $ref: "#/components/securitySchemes/apiKey" },
    },
  },
  externalDocs: { url: "https://example.com/docs" },
  info: {
    contact: {
      email: "apiteam@example.com",
      name: "Swagger API Team",
      url: "https://example.com",
    },
    description: "A sample API that uses a petstore as an example.",
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    termsOfService: "https://example.com/terms/",
    title: "Swagger Petstore",
    version: "1.0.0",
    "x-internal-id": 42,
  },
  openapi: "3.0.4",
  paths: {
    "/pets": {
      get: {
        deprecated: false,
        externalDocs: { description: "More", url: "https://example.com/docs" },
        operationId: "listPets",
        parameters: [
          {
            allowReserved: false,
            description: "How many items to return",
            example: 20,
            explode: false,
            in: "query",
            name: "limit",
            required: false,
            schema: { format: "int32", maximum: 100, type: "integer" },
            style: "form",
          },
          {
            examples: {
              external: { externalValue: "https://example.com/examples/tags" },
              referenced: { $ref: "#/components/examples/tags" },
              two: { summary: "Two tags", value: "dog|cat" },
            },
            in: "query",
            name: "tags",
            schema: {
              items: { type: "string" },
              type: "array",
            },
            style: "pipeDelimited",
          },
          { $ref: "#/components/parameters/traceId" },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                example: [{ id: 1, name: "Rex" }],
                schema: {
                  items: { $ref: "#/components/schemas/Pet" },
                  type: "array",
                },
              },
            },
            description: "A paged array of pets",
            headers: {
              "x-next": { $ref: "#/components/headers/next" },
              "x-rate-limit": {
                deprecated: false,
                description: "Calls per hour allowed",
                explode: false,
                required: false,
                schema: { type: "integer" },
                style: "simple",
              },
            },
            links: {
              byRef: { $ref: "#/components/links/next" },
              next: {
                description: "The next page",
                operationId: "listPets",
                parameters: { limit: "$request.query.limit" },
                server: { url: "https://api.example.com/v1" },
              },
            },
          },
          "4XX": { $ref: "#/components/responses/Error" },
          default: { description: "Unexpected error" },
        },
        security: [{}, { petstoreAuth: ["read:pets"] }],
        servers: [{ url: "/" }],
        summary: "List all pets",
        tags: ["pets"],
        "x-code-samples": [],
      },
      post: {
        callbacks: {
          byRef: { $ref: "#/components/callbacks/onPetStatusChange" },
          onPetStatusChange: {
            "{$request.body#/callbackUrl}": {
              post: {
                requestBody: {
                  content: {
                    "application/json": { schema: { type: "object" } },
                  },
                },
                responses: { "200": { description: "OK" } },
              },
            },
          },
        },
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewPet" },
            },
            "multipart/form-data": {
              encoding: {
                metadata: {
                  allowReserved: false,
                  explode: true,
                  style: "form",
                },
                photo: {
                  contentType: "image/png, image/jpeg",
                  headers: {
                    "X-Upload-Id": { schema: { type: "string" } },
                  },
                },
              },
              schema: {
                properties: {
                  metadata: { nullable: true, type: "object" },
                  photo: { format: "binary", type: "string" },
                },
                type: "object",
              },
            },
          },
          description: "Pet to add",
          required: true,
        },
        responses: {
          "201": { description: "Created" },
        },
        summary: "Create a pet",
      },
      summary: "Pet operations",
    },
    "/pets/{petId}": {
      $ref: "#/components/schemas/ignored-path-item",
      delete: {
        responses: { "204": { description: "Deleted" } },
      },
      parameters: [
        {
          in: "path",
          name: "petId",
          required: true,
          schema: { type: "string" },
          style: "matrix",
        },
      ],
    },
    "x-hidden-paths": ["/internal"],
  },
  security: [{ apiKey: [] }],
  servers: [
    {
      description: "Main server",
      url: "https://{environment}.example.com/v1",
      variables: {
        environment: {
          default: "api",
          description: "Environment prefix",
          enum: ["api", "api.dev", "api.staging"],
        },
      },
    },
  ],
  tags: [
    {
      description: "Pet operations",
      externalDocs: { url: "https://example.com/docs/pets" },
      name: "pets",
      "x-display-name": "Pets",
    },
  ],
  "x-tag-groups": [],
} satisfies OpenAPIObject;

// @ts-expect-error: The `paths` field is REQUIRED in OpenAPI 3.0.
export const missingPaths: OpenAPIObject = {
  info: { title: "API", version: "1.0.0" },
  openapi: "3.0.4",
};

export const noWebhooks = {
  info: { title: "API", version: "1.0.0" },
  openapi: "3.0.4",
  paths: {},
  // @ts-expect-error: The `webhooks` field does not exist in OpenAPI 3.0 (added in 3.1).
  webhooks: {},
} satisfies OpenAPIObject;

export const wrongVersion = {
  info: { title: "API", version: "1.0.0" },
  // @ts-expect-error: The `openapi` version string must be within the 3.0 line.
  openapi: "3.1.0",
  paths: {},
} satisfies OpenAPIObject;

export const schemaWithoutTypeArrays = {
  // @ts-expect-error: A `type` array is not supported in OpenAPI 3.0 (added in 3.1).
  type: ["string", "null"],
} satisfies SchemaObject;

export const booleanExclusiveBounds = {
  // @ts-expect-error: `exclusiveMinimum` is a boolean in OpenAPI 3.0, not a number.
  exclusiveMinimum: 0,
  type: "number",
} satisfies SchemaObject;

// @ts-expect-error: Boolean schemas are not valid Schema Objects in OpenAPI 3.0.
export const booleanSchema = true satisfies SchemaObject;

export const closedReference = {
  $ref: "#/components/schemas/Pet",
  // @ts-expect-error: The 3.0 Reference Object has no `summary`/`description` overrides.
  summary: "A pet",
} satisfies ReferenceObject;

export const noMutualTls = {
  // @ts-expect-error: The `mutualTLS` security scheme type does not exist in OpenAPI 3.0.
  type: "mutualTLS",
} satisfies SecuritySchemeObject;

export const invalidStatusCodeRange = {
  // @ts-expect-error: Only 1XX-5XX status codes and ranges are allowed as response keys.
  "600": { description: "not a valid status code" },
  default: { description: "fallback" },
} satisfies ResponsesObject;

export const typedSchema = {
  default: "available",
  enum: ["available", "pending", "sold"],
  example: "pending",
  type: "string",
} satisfies SchemaObject<string>;

export const typedSchemaMismatch = {
  // @ts-expect-error: `default` must match the schema's data type parameter.
  default: 1,
  type: "string",
} satisfies SchemaObject<string>;
