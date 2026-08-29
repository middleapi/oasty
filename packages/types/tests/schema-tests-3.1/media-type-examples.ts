/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/media-type-examples.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    examples: {
      "frog-example": {},
    },
    schemas: {
      Address: {},
      Pet: {},
    },
  },
  paths: {
    "/something": {
      put: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
              examples: {
                cat: {
                  summary: "An example of a cat",
                  value: {
                    name: "Fluffy",
                    petType: "Cat",
                    color: "White",
                    gender: "male",
                    breed: "Persian",
                  },
                },
                dog: {
                  summary: "An example of a dog with a cat's name",
                  value: {
                    name: "Puma",
                    petType: "Dog",
                    color: "Black",
                    gender: "Female",
                    breed: "Mixed",
                  },
                },
                frog: {
                  $ref: "#/components/examples/frog-example",
                },
              },
            },
            "application/xml": {
              schema: {
                type: "object",
                properties: {
                  foo: {
                    type: "string",
                    xml: {
                      namespace: "https://example.com",
                      prefix: "example",
                      name: "Foo",
                    },
                  },
                  bar: {
                    type: "array",
                    items: {
                      type: "number",
                    },
                    xml: {
                      wrapped: true,
                    },
                  },
                  attr: {
                    type: "string",
                    xml: {
                      attribute: true,
                    },
                  },
                },
              },
            },
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                  },
                  address: {
                    type: "object",
                    properties: {},
                  },
                  icon: {
                    type: "string",
                    contentEncoding: "base64url",
                  },
                },
              },
              encoding: {
                icon: {
                  contentType: "image/png, image/jpeg",
                },
              },
            },
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                  },
                  addresses: {
                    description: "addresses in XML format",
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Address",
                    },
                  },
                  profileImage: {
                    type: "string",
                    format: "binary",
                  },
                  forCoverage: {
                    type: "string",
                  },
                  forCoverage2: {
                    type: "string",
                  },
                },
              },
              encoding: {
                addresses: {
                  contentType: "application/xml; charset=utf-8",
                },
                profileImage: {
                  contentType: "image/png, image/jpeg",
                  headers: {
                    "X-Rate-Limit-Limit": {
                      description:
                        "The number of allowed requests in the current period",
                      schema: {
                        type: "integer",
                      },
                    },
                  },
                },
                forCoverage: {
                  style: "form",
                  explode: false,
                  allowReserved: true,
                },
                forCoverage2: {
                  style: "spaceDelimited",
                  explode: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies OpenAPIObject;
