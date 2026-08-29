/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass/operation-object-example.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.1";

export const doc = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {
    "/pets/{id}": {
      put: {
        tags: ["pet"],
        summary: "Updates a pet in the store with form data",
        operationId: "updatePetWithForm",
        parameters: [
          {
            name: "petId",
            in: "path",
            description: "ID of pet that needs to be updated",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    description: "Updated name of the pet",
                    type: "string",
                  },
                  status: {
                    description: "Updated status of the pet",
                    type: "string",
                  },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pet updated.",
            content: {
              "application/json": {},
              "application/xml": {},
            },
          },
          "405": {
            description: "Method Not Allowed",
            content: {
              "application/json": {},
              "application/xml": {},
            },
          },
        },
        security: [
          {
            petstore_auth: ["write:pets", "read:pets"],
          },
        ],
      },
    },
  },
} satisfies OpenAPIObject;
