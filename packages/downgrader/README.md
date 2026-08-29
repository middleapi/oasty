# @oasty/downgrader

Downgrade [OpenAPI Specification](https://spec.openapis.org/) documents one minor version at a time: 3.2 → 3.1 and 3.1 → 3.0. Each converter works on an entire document or on a single Schema Object.

- **Never throws**: malformed parts are deep-copied through unchanged instead of failing the whole conversion.
- **Never mutates**: the input document is left untouched.
- **Extension-preserving, never extension-inventing**: existing `x-` keys and unknown keys always survive, while constructs the target version cannot express are converted where an equivalent exists and removed otherwise.

## Usage

```ts
import {
  downgradeSchemaV31ToV30,
  downgradeSchemaV32ToV31,
  downgradeSpecV31ToV30,
  downgradeSpecV32ToV31,
} from "@oasty/downgrader";

const v31 = downgradeSpecV32ToV31(v32Document);
const v30 = downgradeSpecV31ToV30(v31Document);

// There is intentionally no direct 3.2 → 3.0 converter; compose the steps:
const downgraded = downgradeSpecV31ToV30(downgradeSpecV32ToV31(v32Document));

// Schema Objects can be converted standalone:
const schema = downgradeSchemaV31ToV30({ type: ["string", "null"] });
// { type: "string", nullable: true }
```

## 3.2 → 3.1

Schema Objects pass through unchanged: 3.2 keeps the exact 3.1 schema dialect, and JSON Schema allows arbitrary extra keywords without an `x-` prefix, so even the 3.2-only OAS vocabulary fields (discriminator `defaultMapping`, XML `nodeType`) are legal to keep as-is.

Converted:

| 3.2 construct | 3.1 result |
| --- | --- |
| `openapi: 3.2.x` | `openapi: 3.1.2` |
| `components.mediaTypes` and content-map `$ref`s to them | references inlined, the component map removed |
| Media type `itemSchema` without a sibling `schema` | `schema: { type: "array", items: … }` (the 3.2 sequential media type data model) |
| Response `summary` when no `description` exists | promoted to `description` (required in 3.1, so `""` is synthesized as a last resort) |
| Example `dataValue` / `serializedValue` when `value` and `externalValue` are absent | promoted to `value` (in that order) |
| Parameter `style: "cookie"` | removed, letting the 3.1 default `form` apply |

Removed (no 3.1 equivalent): `$self`, server `name`, tag `summary`/`parent`/`kind`, the `query` operation and `additionalOperations` of Path Items, `in: "querystring"` parameters (from parameter lists and `components.parameters`), `allowReserved` on non-query parameters, media type `description`, media type / encoding `prefixEncoding`, `itemEncoding`, and nested `encoding`, a media type `itemSchema` beside an existing `schema`, response `summary` beside an existing `description`, OAuth `deviceAuthorization` flows, and security scheme `oauth2MetadataUrl` and `deprecated`.

Known limitations: security requirements using URI keys and `$self`-relative reference resolution are passed through unchanged.

## 3.1 → 3.0

Converted:

| 3.1 construct | 3.0 result |
| --- | --- |
| `openapi: 3.1.x` | `openapi: 3.0.4` |
| missing `paths` | `{}` (required in 3.0) |
| missing operation `responses` | `{ "default": { "description": "" } }` (required and non-empty in 3.0) |
| Reference `summary` / `description` overrides | removed (3.0 references stand alone) |
| Security requirement roles on non-OAuth schemes | emptied (`[]`) |

Removed (no 3.0 equivalent): `webhooks`, `components.pathItems` (local `$ref`s pointing at it are left untouched and will dangle), `jsonSchemaDialect`, `info.summary`, `license.identifier`, and `mutualTLS` security schemes together with the security requirements referencing them.

Schema Objects:

| 3.1 construct | 3.0 result |
| --- | --- |
| `true` / `false` boolean schemas | `{}` / `{ not: {} }` |
| `$ref` with sibling keywords | siblings kept, `$ref` wrapped into `allOf` |
| `type: ["T", "null"]` | `type: "T"` plus `nullable: true` |
| `type: "null"` | `nullable: true` plus `enum: [null]` |
| `type` with several non-null entries | `anyOf` of single-type schemas |
| `const` | single-value `enum` |
| numeric `exclusiveMinimum` / `exclusiveMaximum` | bound plus boolean flag (the tighter bound wins) |
| `examples` | first entry becomes `example` when none exists |
| `contentEncoding: base64` | `format: byte` |
| `contentMediaType: application/octet-stream` | `format: binary` |
| `type: "array"` without `items` | `items: {}` is added (required in 3.0) |
| XML `nodeType` (carried over from a 3.2 chain) | `attribute: true` / `wrapped: true` where expressible, then removed (3.0 forbids unknown XML Object fields) |
| `$schema`, `$id`, `$defs`, `$anchor`, `$dynamicRef`/`$dynamicAnchor`, `$vocabulary`, `$comment`, `if`/`then`/`else`, `dependentSchemas`/`dependentRequired`, `prefixItems` (and its trailing `items`), `contains`/`minContains`/`maxContains`, `patternProperties`, `propertyNames`, `unevaluatedItems`/`unevaluatedProperties`, `contentSchema` | removed — dropping these only loosens validation, which is the safe direction for a downgrade |

## Sponsors

Like what we build over at [middleapi](https://github.com/middleapi)? You can help keep it going through [GitHub Sponsors](https://github.com/sponsors/dinwwwh) or [Open Collective](https://opencollective.com/middleapi). Every bit helps! 🚀
