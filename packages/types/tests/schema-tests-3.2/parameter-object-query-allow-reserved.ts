/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/parameter-object-query-allowReserved.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title:
      "allowReserved only permitted with in and style values that percent-encode",
    version: "1.0.0",
  },
  components: {
    parameters: {
      my_query: {
        name: "my_query",
        in: "query",
        allowReserved: true,
        schema: {},
      },
    },
  },
} satisfies OpenAPIObject;
