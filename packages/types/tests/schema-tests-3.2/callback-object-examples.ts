/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/callback-object-examples.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    callbacks: {
      myCallback: {
        "{$request.query.queryUrl}": {
          post: {
            requestBody: {
              description: "Callback payload",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SomePayload",
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "callback successfully processed",
              },
            },
          },
        },
      },
      transactionCallback: {
        "http://notificationServer.com?transactionId={$request.body#/id}&email={$request.body#/email}":
          {
            post: {
              requestBody: {
                description: "Callback payload",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/SomePayload",
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "callback successfully processed",
                },
              },
            },
          },
      },
    },
    schemas: {
      SomePayload: {},
    },
  },
} satisfies OpenAPIObject;
