/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/learn.openapis.org/tree/main/examples/non-oauth-scopes-3.1.json
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
