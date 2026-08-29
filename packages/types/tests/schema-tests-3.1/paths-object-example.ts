/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/paths-object-example.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    schemas: {
      pet: {},
    },
  },
  paths: {
    "/pets": {
      get: {
        description:
          "Returns all pets from the system that the user has access to",
        responses: {
          "200": {
            description: "A list of pets.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/pet",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies OpenAPIObject;
