/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/non-oauth-scopes.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "Non-oAuth Scopes example",
    version: "1.0.0",
  },
  paths: {
    "/users": {
      get: {
        security: [
          {
            bearerAuth: ["read:users", "public"],
          },
        ],
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "jwt",
        description:
          "note: non-oauth scopes are not defined at the securityScheme level",
      },
    },
  },
} satisfies OpenAPIObject;
