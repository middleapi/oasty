/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/tag-object-example.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {},
  tags: [
    {
      name: "account-updates",
      summary: "Account Updates",
      description: "Account update operations",
      kind: "nav",
    },
    {
      name: "partner",
      summary: "Partner",
      description: "Operations available to the partners network",
      parent: "external",
      kind: "audience",
    },
    {
      name: "external",
      summary: "External",
      description: "Operations available to external consumers",
      kind: "audience",
      externalDocs: {
        description: "Find more info here",
        url: "https://example.com",
      },
    },
  ],
} satisfies OpenAPIObject;
