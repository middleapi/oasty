/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/tag-object-example.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {},
  tags: [
    {
      name: "pet",
      description: "Pets operations",
    },
    {
      name: "external",
      description: "Operations available to external consumers",
      externalDocs: {
        description: "Find more info here",
        url: "https://example.com",
      },
    },
  ],
} satisfies OpenAPIObject;
