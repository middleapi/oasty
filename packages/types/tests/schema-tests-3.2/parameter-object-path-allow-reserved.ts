/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/parameter-object-path-allowReserved.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "api",
    version: "1.0.0",
  },
  components: {
    parameters: {
      path: {
        name: "my-path",
        in: "path",
        required: true,
        allowReserved: false,
        schema: {},
      },
    },
  },
} satisfies OpenAPIObject;
