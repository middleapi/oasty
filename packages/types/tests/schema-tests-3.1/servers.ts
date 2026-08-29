/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/servers.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {},
  servers: [
    {
      url: "/v1",
      description: "Run locally.",
    },
    {
      url: "https://production.com/v1",
      description: "Run on production server.",
    },
    {
      url: "https://{username}.gigantic-server.com:{port}/{basePath}",
      description: "The production API server",
      variables: {
        username: {
          default: "demo",
          description:
            "A user-specific subdomain. Use `demo` for a free sandbox environment.",
        },
        port: {
          enum: ["8443", "443"],
          default: "8443",
        },
        basePath: {
          default: "v2",
        },
      },
    },
  ],
} satisfies OpenAPIObject;
