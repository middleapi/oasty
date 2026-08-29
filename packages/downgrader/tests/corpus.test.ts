import type { OpenAPIV3_1, OpenAPIV3_2 } from "@oasty/types";
/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-object-parameters, anti-slop/no-unsafe-dictionary-type -- these corpus tests bulk-feed whole OpenAPI documents into the converters and a generic JSON-schema validator, so version-agnostic document shapes are the domain contract */
import { Validator } from "@seriousme/openapi-schema-validator";

import { doc as exampleQueryV32 } from "../../types/tests/examples/3-2-query-example";
import { doc as exampleTagsV32 } from "../../types/tests/examples/3-2-tags-example";
import { doc as exampleNonOauthScopesV31 } from "../../types/tests/examples/non-oauth-scopes-3-1";
import { doc as exampleTictactoeV31 } from "../../types/tests/examples/tictactoe-3-1";
import { doc as exampleWebhookV31 } from "../../types/tests/examples/webhook-example-3-1";
import { doc as callbackObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/callback-object-examples";
import { doc as compPathitemsV31 } from "../../types/tests/schema-tests-3.1/comp-pathitems";
import { doc as componentsObjectExampleV31 } from "../../types/tests/schema-tests-3.1/components-object-example";
import { doc as exampleObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/example-object-examples";
import { doc as headerObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/header-object-examples";
import { doc as infoObjectExampleV31 } from "../../types/tests/schema-tests-3.1/info-object-example";
import { doc as infoSummaryV31 } from "../../types/tests/schema-tests-3.1/info-summary";
import { doc as jsonSchemaDialectV31 } from "../../types/tests/schema-tests-3.1/json-schema-dialect";
import { doc as licenseIdentifierV31 } from "../../types/tests/schema-tests-3.1/license-identifier";
import { doc as linkObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/link-object-examples";
import { doc as mediaTypeExamplesV31 } from "../../types/tests/schema-tests-3.1/media-type-examples";
import { doc as megaV31 } from "../../types/tests/schema-tests-3.1/mega";
import { doc as minimalCompV31 } from "../../types/tests/schema-tests-3.1/minimal-comp";
import { doc as minimalHooksV31 } from "../../types/tests/schema-tests-3.1/minimal-hooks";
import { doc as minimalPathsV31 } from "../../types/tests/schema-tests-3.1/minimal-paths";
import { doc as nonOauthScopesV31 } from "../../types/tests/schema-tests-3.1/non-oauth-scopes";
import { doc as operationObjectExampleV31 } from "../../types/tests/schema-tests-3.1/operation-object-example";
import { doc as parameterObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/parameter-object-examples";
import { doc as parameterObjectQueryAllowReservedV31 } from "../../types/tests/schema-tests-3.1/parameter-object-query-allow-reserved";
import { doc as pathItemObjectExampleV31 } from "../../types/tests/schema-tests-3.1/path-item-object-example";
import { doc as pathItemServersParametersV31 } from "../../types/tests/schema-tests-3.1/path-item-servers-parameters";
import { doc as pathNoResponseV31 } from "../../types/tests/schema-tests-3.1/path-no-response";
import { doc as pathVarEmptyPathitemV31 } from "../../types/tests/schema-tests-3.1/path-var-empty-pathitem";
import { doc as pathsObjectExampleV31 } from "../../types/tests/schema-tests-3.1/paths-object-example";
import { doc as requestBodyExamplesV31 } from "../../types/tests/schema-tests-3.1/request-body-examples";
import { doc as responseObjectExamplesV31 } from "../../types/tests/schema-tests-3.1/response-object-examples";
import { doc as schemaV31 } from "../../types/tests/schema-tests-3.1/schema";
import { doc as schemaObjectDeprecatedExampleKeywordV31 } from "../../types/tests/schema-tests-3.1/schema-object-deprecated-example-keyword";
import { doc as serversV31 } from "../../types/tests/schema-tests-3.1/servers";
import { doc as specificationExtensionsV31 } from "../../types/tests/schema-tests-3.1/specification-extensions";
import { doc as tagObjectExampleV31 } from "../../types/tests/schema-tests-3.1/tag-object-example";
import { doc as validSchemaTypesV31 } from "../../types/tests/schema-tests-3.1/valid-schema-types";
import { doc as webhookExampleV31 } from "../../types/tests/schema-tests-3.1/webhook-example";
import { doc as callbackObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/callback-object-examples";
import { doc as compPathitemsV32 } from "../../types/tests/schema-tests-3.2/comp-pathitems";
import { doc as componentsObjectExampleV32 } from "../../types/tests/schema-tests-3.2/components-object-example";
import { doc as exampleObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/example-object-examples";
import { doc as headerObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/header-object-examples";
import { doc as infoObjectExampleV32 } from "../../types/tests/schema-tests-3.2/info-object-example";
import { doc as infoSummaryV32 } from "../../types/tests/schema-tests-3.2/info-summary";
import { doc as jsonSchemaDialectV32 } from "../../types/tests/schema-tests-3.2/json-schema-dialect";
import { doc as licenseIdentifierV32 } from "../../types/tests/schema-tests-3.2/license-identifier";
import { doc as linkObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/link-object-examples";
import { doc as mediaTypeExamplesV32 } from "../../types/tests/schema-tests-3.2/media-type-examples";
import { doc as megaV32 } from "../../types/tests/schema-tests-3.2/mega";
import { doc as minimalCompV32 } from "../../types/tests/schema-tests-3.2/minimal-comp";
import { doc as minimalHooksV32 } from "../../types/tests/schema-tests-3.2/minimal-hooks";
import { doc as minimalPathsV32 } from "../../types/tests/schema-tests-3.2/minimal-paths";
import { doc as nonOauthScopesV32 } from "../../types/tests/schema-tests-3.2/non-oauth-scopes";
import { doc as operationObjectExampleV32 } from "../../types/tests/schema-tests-3.2/operation-object-example";
import { doc as parameterObjectCookieFormAllowReservedV32 } from "../../types/tests/schema-tests-3.2/parameter-object-cookie-form-allow-reserved";
import { doc as parameterObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/parameter-object-examples";
import { doc as parameterObjectPathAllowReservedV32 } from "../../types/tests/schema-tests-3.2/parameter-object-path-allow-reserved";
import { doc as parameterObjectQueryAllowReservedV32 } from "../../types/tests/schema-tests-3.2/parameter-object-query-allow-reserved";
import { doc as pathItemObjectExampleV32 } from "../../types/tests/schema-tests-3.2/path-item-object-example";
import { doc as pathItemServersParametersV32 } from "../../types/tests/schema-tests-3.2/path-item-servers-parameters";
import { doc as pathNoResponseV32 } from "../../types/tests/schema-tests-3.2/path-no-response";
import { doc as pathVarEmptyPathitemV32 } from "../../types/tests/schema-tests-3.2/path-var-empty-pathitem";
import { doc as pathsObjectExampleV32 } from "../../types/tests/schema-tests-3.2/paths-object-example";
import { doc as requestBodyExamplesV32 } from "../../types/tests/schema-tests-3.2/request-body-examples";
import { doc as responseObjectExamplesV32 } from "../../types/tests/schema-tests-3.2/response-object-examples";
import { doc as schemaV32 } from "../../types/tests/schema-tests-3.2/schema";
import { doc as schemaObjectDeprecatedExampleKeywordV32 } from "../../types/tests/schema-tests-3.2/schema-object-deprecated-example-keyword";
import { doc as serversV32 } from "../../types/tests/schema-tests-3.2/servers";
import { doc as specificationExtensionsV32 } from "../../types/tests/schema-tests-3.2/specification-extensions";
import { doc as styleDefaultsV32 } from "../../types/tests/schema-tests-3.2/style-defaults";
import { doc as tagObjectExampleV32 } from "../../types/tests/schema-tests-3.2/tag-object-example";
import { doc as validSchemaTypesV32 } from "../../types/tests/schema-tests-3.2/valid-schema-types";
import { doc as webhookExampleV32 } from "../../types/tests/schema-tests-3.2/webhook-example";
import { downgradeSpecV31ToV30, downgradeSpecV32ToV31 } from "../src/index";

const asSpec31 = (value: unknown): OpenAPIV3_1.OpenAPIObject =>
  // SAFETY: fixture literals infer unions that do not always narrow to the declared document type; the converters accept arbitrary documents at runtime.
  value as OpenAPIV3_1.OpenAPIObject;

const asSpec32 = (value: unknown): OpenAPIV3_2.OpenAPIObject =>
  // SAFETY: fixture literals infer unions that do not always narrow to the declared document type; the converters accept arbitrary documents at runtime.
  value as OpenAPIV3_2.OpenAPIObject;

const asValidatorInput = (value: unknown): Record<string, unknown> =>
  // SAFETY: the validator accepts arbitrary JSON documents at runtime.
  value as Record<string, unknown>;

const validate = async (spec: object) => {
  const validator = new Validator();
  const result = await validator.validate(
    asValidatorInput(structuredClone(spec))
  );
  return { result, version: validator.version };
};

const expectValidAs = async (
  spec: object,
  expectedVersion: string
): Promise<void> => {
  const { result, version } = await validate(spec);
  expect(result.errors ?? []).toEqual([]);
  expect(result.valid).toBe(true);
  expect(version).toBe(expectedVersion);
};

/**
 * Excluded 3.1 fixtures:
 *
 * - `security-scheme-object-examples`: contains a `$ref` to an external URL,
 *   which the validator cannot resolve ("only internal refs are supported") —
 *   a validator limitation, not a conversion defect.
 * - `style-defaults`: its `encoding_object_defaults` parameter is a `content`
 *   path parameter without `required: true`; the official 3.1 schema only
 *   enforces `required` for schema-based path parameters while the 3.0 schema
 *   enforces it for all, so the input itself is inexpressible in valid 3.0.
 */
const corpus31: readonly (readonly [
  name: string,
  doc: OpenAPIV3_1.OpenAPIObject,
])[] = [
  ["examples/non-oauth-scopes-3-1", asSpec31(exampleNonOauthScopesV31)],
  ["examples/tictactoe-3-1", asSpec31(exampleTictactoeV31)],
  ["examples/webhook-example-3-1", asSpec31(exampleWebhookV31)],
  ["callback-object-examples", asSpec31(callbackObjectExamplesV31)],
  ["comp-pathitems", asSpec31(compPathitemsV31)],
  ["components-object-example", asSpec31(componentsObjectExampleV31)],
  ["example-object-examples", asSpec31(exampleObjectExamplesV31)],
  ["header-object-examples", asSpec31(headerObjectExamplesV31)],
  ["info-object-example", asSpec31(infoObjectExampleV31)],
  ["info-summary", asSpec31(infoSummaryV31)],
  ["json-schema-dialect", asSpec31(jsonSchemaDialectV31)],
  ["license-identifier", asSpec31(licenseIdentifierV31)],
  ["link-object-examples", asSpec31(linkObjectExamplesV31)],
  ["media-type-examples", asSpec31(mediaTypeExamplesV31)],
  ["mega", asSpec31(megaV31)],
  ["minimal-comp", asSpec31(minimalCompV31)],
  ["minimal-hooks", asSpec31(minimalHooksV31)],
  ["minimal-paths", asSpec31(minimalPathsV31)],
  ["non-oauth-scopes", asSpec31(nonOauthScopesV31)],
  ["operation-object-example", asSpec31(operationObjectExampleV31)],
  ["parameter-object-examples", asSpec31(parameterObjectExamplesV31)],
  [
    "parameter-object-query-allow-reserved",
    asSpec31(parameterObjectQueryAllowReservedV31),
  ],
  ["path-item-object-example", asSpec31(pathItemObjectExampleV31)],
  ["path-item-servers-parameters", asSpec31(pathItemServersParametersV31)],
  ["path-no-response", asSpec31(pathNoResponseV31)],
  ["path-var-empty-pathitem", asSpec31(pathVarEmptyPathitemV31)],
  ["paths-object-example", asSpec31(pathsObjectExampleV31)],
  ["request-body-examples", asSpec31(requestBodyExamplesV31)],
  ["response-object-examples", asSpec31(responseObjectExamplesV31)],
  ["schema", asSpec31(schemaV31)],
  [
    "schema-object-deprecated-example-keyword",
    asSpec31(schemaObjectDeprecatedExampleKeywordV31),
  ],
  ["servers", asSpec31(serversV31)],
  ["specification-extensions", asSpec31(specificationExtensionsV31)],
  ["tag-object-example", asSpec31(tagObjectExampleV31)],
  ["valid-schema-types", asSpec31(validSchemaTypesV31)],
  ["webhook-example", asSpec31(webhookExampleV31)],
];

/**
 * Excluded 3.2 fixtures:
 *
 * - `security-scheme-object-examples`: contains a `$ref` to an external URL,
 *   which the validator cannot resolve ("only internal refs are supported") —
 *   a validator limitation, not a conversion defect.
 */
const corpus32: readonly (readonly [
  name: string,
  doc: OpenAPIV3_2.OpenAPIObject,
])[] = [
  ["examples/3-2-query-example", asSpec32(exampleQueryV32)],
  ["examples/3-2-tags-example", asSpec32(exampleTagsV32)],
  ["callback-object-examples", asSpec32(callbackObjectExamplesV32)],
  ["comp-pathitems", asSpec32(compPathitemsV32)],
  ["components-object-example", asSpec32(componentsObjectExampleV32)],
  ["example-object-examples", asSpec32(exampleObjectExamplesV32)],
  ["header-object-examples", asSpec32(headerObjectExamplesV32)],
  ["info-object-example", asSpec32(infoObjectExampleV32)],
  ["info-summary", asSpec32(infoSummaryV32)],
  ["json-schema-dialect", asSpec32(jsonSchemaDialectV32)],
  ["license-identifier", asSpec32(licenseIdentifierV32)],
  ["link-object-examples", asSpec32(linkObjectExamplesV32)],
  ["media-type-examples", asSpec32(mediaTypeExamplesV32)],
  ["mega", asSpec32(megaV32)],
  ["minimal-comp", asSpec32(minimalCompV32)],
  ["minimal-hooks", asSpec32(minimalHooksV32)],
  ["minimal-paths", asSpec32(minimalPathsV32)],
  ["non-oauth-scopes", asSpec32(nonOauthScopesV32)],
  ["operation-object-example", asSpec32(operationObjectExampleV32)],
  [
    "parameter-object-cookie-form-allow-reserved",
    asSpec32(parameterObjectCookieFormAllowReservedV32),
  ],
  ["parameter-object-examples", asSpec32(parameterObjectExamplesV32)],
  [
    "parameter-object-path-allow-reserved",
    asSpec32(parameterObjectPathAllowReservedV32),
  ],
  [
    "parameter-object-query-allow-reserved",
    asSpec32(parameterObjectQueryAllowReservedV32),
  ],
  ["path-item-object-example", asSpec32(pathItemObjectExampleV32)],
  ["path-item-servers-parameters", asSpec32(pathItemServersParametersV32)],
  ["path-no-response", asSpec32(pathNoResponseV32)],
  ["path-var-empty-pathitem", asSpec32(pathVarEmptyPathitemV32)],
  ["paths-object-example", asSpec32(pathsObjectExampleV32)],
  ["request-body-examples", asSpec32(requestBodyExamplesV32)],
  ["response-object-examples", asSpec32(responseObjectExamplesV32)],
  ["schema", asSpec32(schemaV32)],
  [
    "schema-object-deprecated-example-keyword",
    asSpec32(schemaObjectDeprecatedExampleKeywordV32),
  ],
  ["servers", asSpec32(serversV32)],
  ["specification-extensions", asSpec32(specificationExtensionsV32)],
  ["style-defaults", asSpec32(styleDefaultsV32)],
  ["tag-object-example", asSpec32(tagObjectExampleV32)],
  ["valid-schema-types", asSpec32(validSchemaTypesV32)],
  ["webhook-example", asSpec32(webhookExampleV32)],
];

describe("3.1 corpus downgraded to 3.0", () => {
  it.each(corpus31)(
    "converts %s to a valid 3.0 document without mutating the input",
    async (_name, doc) => {
      const before = structuredClone(doc);
      const v30 = downgradeSpecV31ToV30(doc);
      expect(v30.openapi).toBe("3.0.4");
      await expectValidAs(v30, "3.0");
      expect(doc).toEqual(before);
    }
  );
});

describe("3.2 corpus downgraded to 3.1 and chained to 3.0", () => {
  it.each(corpus32)(
    "converts %s to valid 3.1 and 3.0 documents without mutating the input",
    async (_name, doc) => {
      const before = structuredClone(doc);
      const v31 = downgradeSpecV32ToV31(doc);
      expect(v31.openapi).toBe("3.1.2");
      await expectValidAs(v31, "3.1");
      const v30 = downgradeSpecV31ToV30(v31);
      expect(v30.openapi).toBe("3.0.4");
      await expectValidAs(v30, "3.0");
      expect(doc).toEqual(before);
    }
  );
});
