/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass/link-object-examples.yaml
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {
    "/users/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "the user identifier, as userId",
          schema: {
            type: "string",
          },
        },
      ],
      get: {
        responses: {
          "200": {
            description: "the user being returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uuid: {
                      type: "string",
                      format: "uuid",
                    },
                  },
                },
              },
            },
            links: {
              address: {
                operationId: "getUserAddress",
                parameters: {
                  userid: "$request.path.id",
                },
              },
              address2: {
                operationId: "getUserAddressByUUID",
                parameters: {
                  userUuid: "$response.body#/uuid",
                },
              },
              UserRepositories: {
                operationRef: "#/paths/~12.0~1repositories~1%7Busername%7D/get",
                parameters: {
                  username: "$response.body#/username",
                },
              },
              UserRepositories2: {
                operationRef:
                  "https://na2.gigantic-server.com/#/paths/~12.0~1repositories~1%7Busername%7D/get",
                parameters: {
                  username: "$response.body#/username",
                },
              },
              withBody: {
                operationId: "queryUserWithBody",
                requestBody: {
                  userId: "$request.path.id",
                },
              },
            },
          },
        },
      },
    },
    "/users/{userid}/address": {
      parameters: [
        {
          name: "userid",
          in: "path",
          required: true,
          description: "the user identifier, as userId",
          schema: {
            type: "string",
          },
        },
      ],
      get: {
        operationId: "getUserAddress",
        responses: {
          "200": {
            description: "the user's address",
          },
        },
      },
    },
  },
} satisfies OpenAPIObject;
