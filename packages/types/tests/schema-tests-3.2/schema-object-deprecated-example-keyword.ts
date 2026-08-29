/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/schema-object-deprecated-example-keyword.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {
    "/user": {
      parameters: [
        {
          in: "query",
          name: "example",
          schema: {
            type: "object",
            example: {
              numbers: [1, 2],
              flag: null,
            },
          },
        },
      ],
    },
  },
} satisfies OpenAPIObject;
