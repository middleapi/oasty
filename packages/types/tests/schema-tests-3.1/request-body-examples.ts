/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/request-body-examples.yaml
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
      User: {},
    },
  },
  paths: {
    "/something": {
      put: {
        requestBody: {
          description: "user to add to the system",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/User",
              },
              examples: {
                user: {
                  summary: "User example",
                  externalValue: "https://foo.bar/examples/user-example.json",
                },
              },
            },
            "application/xml": {
              schema: {
                $ref: "#/components/schemas/User",
              },
              examples: {
                user: {
                  summary: "User example in XML",
                  externalValue: "https://foo.bar/examples/user-example.xml",
                },
              },
            },
            "text/plain": {
              examples: {
                user: {
                  summary: "User example in plain text",
                  externalValue: "https://foo.bar/examples/user-example.txt",
                },
              },
            },
            "*/*": {
              examples: {
                user: {
                  summary: "User example in other format",
                  externalValue:
                    "https://foo.bar/examples/user-example.whatever",
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies OpenAPIObject;
