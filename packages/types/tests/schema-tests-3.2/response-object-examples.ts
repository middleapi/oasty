/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/response-object-examples.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    responses: {
      "complex-object-array": {
        summary: "Complex object array",
        description: "A complex object array response",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                $ref: "#/components/schemas/VeryComplexType",
              },
            },
          },
        },
      },
      "simple-string": {
        description: "A simple string response",
        content: {
          "text/plain": {
            schema: {
              type: "string",
            },
          },
        },
      },
      "plain-text-with-headers": {
        description: "A simple string response",
        content: {
          "text/plain": {
            schema: {
              type: "string",
            },
            example: "whoa!",
          },
        },
        headers: {
          "X-Rate-Limit-Limit": {
            description: "The number of allowed requests in the current period",
            schema: {
              type: "integer",
            },
          },
          "X-Rate-Limit-Remaining": {
            description:
              "The number of remaining requests in the current period",
            schema: {
              type: "integer",
            },
          },
          "X-Rate-Limit-Reset": {
            description: "The number of seconds left in the current period",
            schema: {
              type: "integer",
            },
          },
        },
      },
      "no-return-value": {
        description: "object created",
      },
    },
    schemas: {
      VeryComplexType: {},
    },
  },
} satisfies OpenAPIObject;
