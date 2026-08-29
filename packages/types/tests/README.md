# Real-document fixtures

Type-level fixtures generated from official OpenAPI documents. Each file embeds a complete document as an object literal checked with `satisfies OpenAPIObject` against the version module matching its `openapi` field, so `tsc` at the repository root re-validates the whole corpus.

Sources (Apache-2.0, © the OpenAPI Initiative):

- `examples/` — the official example documents from [OAI/learn.openapis.org](https://github.com/OAI/learn.openapis.org/tree/main/examples) (v3.0, v3.1, and v3.2 sets).
- `schema-tests-3.1/` — the `tests/schema/pass` documents from the [OAI/OpenAPI-Specification `v3.1-dev` branch](https://github.com/OAI/OpenAPI-Specification/tree/v3.1-dev/tests/schema/pass).
- `schema-tests-3.2/` — the `tests/schema/pass` documents from the [OAI/OpenAPI-Specification `v3.2-dev` branch](https://github.com/OAI/OpenAPI-Specification/tree/v3.2-dev/tests/schema/pass).

The corresponding `tests/schema/fail` documents are intentionally not committed: most of them violate semantic rules that these types document rather than encode (mutual exclusions, at-least-one-of containers, per-location field applicability, non-empty arrays, map-key syntax). The ones that are type-expressible (unknown top-level fields, wrong value shapes, excess fields on Header/Link Objects, 3.2-only style values used in 3.1 documents) were verified to produce compile errors when this corpus was generated.

The files are generated — do not edit them by hand; refresh them from the sources above instead.
