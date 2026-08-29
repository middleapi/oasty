/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/webhook-example.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "Webhook Example",
    version: "1.0.0",
  },
  webhooks: {
    newPet: {
      post: {
        requestBody: {
          description: "Information about a new pet in the system",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Return a 200 status to indicate that the data was received successfully",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        required: ["id", "name"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
          },
          name: {
            type: "string",
          },
          tag: {
            type: "string",
          },
        },
      },
    },
  },
} satisfies OpenAPIObject;
