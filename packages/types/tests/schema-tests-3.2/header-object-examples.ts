/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/header-object-examples.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    headers: {
      "X-Rate-Limit-Limit": {
        description: "The number of allowed requests in the current period",
        deprecated: false,
        schema: {
          type: "integer",
        },
      },
      ETag: {
        required: true,
        content: {
          "text/plain": {
            schema: {
              type: "string",
              pattern: '^"',
            },
          },
        },
      },
      Reference: {
        $ref: "#/components/headers/ETag",
      },
      Style: {
        schema: {
          type: "array",
        },
        style: "simple",
        explode: true,
      },
    },
  },
} satisfies OpenAPIObject;
