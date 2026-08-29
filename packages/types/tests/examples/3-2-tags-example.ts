/* oxlint-disable sort-keys, unicorn/no-thenable */
// Generated from https://github.com/OAI/learn.openapis.org/tree/main/examples/3.2-tags-example.json
// Do not edit by hand; regenerate instead.
import type { OpenAPIObject } from "../../src/v3.2";

export const doc = {
  openapi: "3.2.0",
  info: {
    title: "Flight API",
    version: "1.0.0",
  },
  tags: [
    {
      name: "flights",
      summary: "Flights",
      description: "Core flight operations",
      kind: "nav",
    },
    {
      name: "international",
      summary: "International",
      description: "Flights that cross country borders",
      parent: "flights",
      kind: "nav",
    },
    {
      name: "domestic",
      summary: "Domestic",
      description: "Flights within a single country",
      parent: "flights",
      kind: "nav",
    },
    {
      name: "delays",
      summary: "Delays",
      description: "Information about flight delays",
      kind: "badge",
      externalDocs: {
        description: "Delay compensation policies",
        url: "https://docs.example.com/delay-policies",
      },
    },
  ],
  paths: {
    "/flights": {
      get: {
        tags: ["flights"],
        summary: "List all flights",
      },
    },
    "/flights/international": {
      get: {
        tags: ["international"],
        summary: "List international flights",
      },
    },
    "/flights/domestic": {
      get: {
        tags: ["domestic"],
        summary: "List domestic flights",
      },
    },
    "/flights/delayed": {
      get: {
        tags: ["delays"],
        summary: "Get delayed flights",
      },
    },
  },
} satisfies OpenAPIObject;
