/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/json_schema_dialect.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    summary: "Testing jsonSchemaDialect",
    title: "My API",
    version: "1.0.0",
    license: {
      name: "Apache 2.0",
      identifier: "Apache-2.0",
    },
  },
  jsonSchemaDialect:
    "https://spec.openapis.org/oas/3.1/dialect/WORK-IN-PROGRESS",
  components: {
    schemas: {
      WithDollarSchema: {
        $id: "locked-metaschema",
        $schema: "https://spec.openapis.org/oas/3.1/dialect/WORK-IN-PROGRESS",
      },
    },
  },
  paths: {},
} satisfies OpenAPIObject;
