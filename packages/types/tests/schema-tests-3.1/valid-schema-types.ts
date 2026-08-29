/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/valid_schema_types.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.1",
  info: {
    title: "API",
    version: "1.0.0",
  },
  components: {
    schemas: {
      anything_boolean: true,
      nothing_boolean: false,
      anything_object: {},
      nothing_object: {
        not: {},
      },
    },
  },
} satisfies OpenAPIObject;
