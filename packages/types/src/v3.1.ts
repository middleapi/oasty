/**
 * TypeScript types for the OpenAPI Specification v3.1, authored against the
 * latest patch release 3.1.2.
 *
 * Types that are structurally identical to OpenAPI 3.0 (including everything
 * they reference) are re-exported from `./v3.0`; every other type is
 * redefined here. The most significant difference is that the 3.1 Schema
 * Object is a superset of JSON Schema Draft 2020-12, so `nullable` is gone
 * (use `type` arrays including `"null"`), `$ref` is a plain schema keyword
 * (no more `Schema Object | Reference Object` unions), and boolean schemas
 * are valid Schema Objects.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html}
 */

import type {
  ContactObject,
  ExampleObject,
  ExternalDocumentationObject,
  LinkObject,
  ParameterLocation,
  ParameterStyle,
  QueryParameterStyle,
  SpecificationExtensions,
  TagObject,
  XMLObject,
  ApiKeySecuritySchemeObject,
  HttpSecuritySchemeObject,
  OAuth2SecuritySchemeObject,
  OpenIdConnectSecuritySchemeObject,
} from "./v3.0";

export type {
  ApiKeySecuritySchemeObject,
  AuthorizationCodeOAuthFlowObject,
  ClientCredentialsOAuthFlowObject,
  ContactObject,
  ExampleObject,
  ExternalDocumentationObject,
  HttpSecuritySchemeObject,
  ImplicitOAuthFlowObject,
  LinkObject,
  OAuth2SecuritySchemeObject,
  OAuthFlowObject,
  OAuthFlowObjectBase,
  OAuthFlowsObject,
  OpenIdConnectSecuritySchemeObject,
  ParameterLocation,
  ParameterStyle,
  PasswordOAuthFlowObject,
  QueryParameterStyle,
  SpecificationExtensions,
  TagObject,
  XMLObject,
} from "./v3.0";

/**
 * An object representing a Server.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#server-object}
 */
export interface ServerObject extends SpecificationExtensions {
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables
   * and MAY be relative, to indicate that the host location is relative to
   * the location where the document containing the Server Object is being
   * served. Query and fragment MUST NOT be part of this URL. Variable
   * substitutions will be made when a variable is named in `{braces}`.
   */
  url: string;
  /**
   * An optional string describing the host designated by the URL. CommonMark
   * syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * A map between a variable name and its value. The value is used for
   * substitution in the server's URL template.
   */
  variables?: Record<string, ServerVariableObject>;
}

/**
 * An object representing a Server Variable for server URL template
 * substitution.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#server-variable-object}
 */
export interface ServerVariableObject extends SpecificationExtensions {
  /**
   * An enumeration of string values to be used if the substitution options
   * are from a limited set. The array MUST NOT be empty.
   */
  enum?: string[];
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent
   * if an alternate value is not supplied. If the `enum` is defined, the
   * value MUST exist in the enum's values. Note that this behavior is
   * different from the Schema Object's `default` keyword, which documents the
   * receiver's behavior rather than inserting the value into the data.
   */
  default: string;
  /**
   * An optional description for the server variable. CommonMark syntax MAY be
   * used for rich text representation.
   */
  description?: string;
}

/**
 * This is the root object of the OpenAPI Description.
 *
 * An OpenAPI Description MUST contain at least one of `paths`, `components`,
 * or `webhooks`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#openapi-object}
 */
export interface OpenAPIObject extends SpecificationExtensions {
  /**
   * REQUIRED. This string MUST be the version number of the OpenAPI
   * Specification that the OpenAPI Document uses. The `openapi` field SHOULD
   * be used by tooling to interpret the OpenAPI Document. This is not related
   * to the API `info.version` string.
   */
  openapi: `3.1.${string}`;
  /**
   * REQUIRED. Provides metadata about the API. The metadata MAY be used by
   * tooling as required.
   */
  info: InfoObject;
  /**
   * The default value for the `$schema` keyword within Schema Objects
   * contained within this OAS document. This MUST be in the form of a URI.
   */
  jsonSchemaDialect?: string;
  /**
   * An array of Server Objects, which provide connectivity information to a
   * target server. If the `servers` field is not provided, or is an empty
   * array, the default value would be a Server Object with a `url` value of
   * `/`.
   */
  servers?: ServerObject[];
  /**
   * The available paths and operations for the API.
   */
  paths?: PathsObject;
  /**
   * The incoming webhooks that MAY be received as part of this API and that
   * the API consumer MAY choose to implement. Closely related to the
   * `callbacks` feature, this section describes requests initiated other than
   * by an API call, for example by an out-of-band registration. The key name
   * is a unique string to refer to each webhook, while the (optionally
   * referenced) Path Item Object describes a request that may be initiated by
   * the API provider and the expected responses.
   */
  webhooks?: Record<string, PathItemObject>;
  /**
   * An element to hold various Objects for the OpenAPI Description.
   */
  components?: ComponentsObject;
  /**
   * A declaration of which security mechanisms can be used across the API.
   * The list of values includes alternative Security Requirement Objects;
   * only one of them needs to be satisfied to authorize a request. Individual
   * operations can override this definition. The list can be incomplete, up
   * to being empty or absent. To make security explicitly optional, an empty
   * security requirement (`{}`) can be included in the array.
   */
  security?: SecurityRequirementObject[];
  /**
   * A list of tags used by the OpenAPI Description with additional metadata.
   * The order of the tags can be used to reflect on their order by the
   * parsing tools. Not all tags that are used by the Operation Object must be
   * declared; undeclared tags MAY be organized randomly or based on the
   * tools' logic. Each tag name in the list MUST be unique.
   */
  tags?: TagObject[];
  /**
   * Additional external documentation.
   */
  externalDocs?: ExternalDocumentationObject;
}

/**
 * The object provides metadata about the API. The metadata MAY be used by the
 * clients if needed, and MAY be presented in editing or documentation
 * generation tools for convenience.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#info-object}
 */
export interface InfoObject extends SpecificationExtensions {
  /**
   * REQUIRED. The title of the API.
   */
  title: string;
  /**
   * A short summary of the API.
   */
  summary?: string;
  /**
   * A description of the API. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * A URI for the Terms of Service for the API. This MUST be in the form of a
   * URI.
   */
  termsOfService?: string;
  /**
   * The contact information for the exposed API.
   */
  contact?: ContactObject;
  /**
   * The license information for the exposed API.
   */
  license?: LicenseObject;
  /**
   * REQUIRED. The version of the OpenAPI Document (which is distinct from the
   * OpenAPI Specification version, the version of the API being described, or
   * the version of the OpenAPI Description).
   */
  version: string;
}

/**
 * License information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#license-object}
 */
export interface LicenseObject extends SpecificationExtensions {
  /**
   * REQUIRED. The license name used for the API.
   */
  name: string;
  /**
   * An SPDX license expression for the API. The `identifier` field is
   * mutually exclusive of the `url` field.
   */
  identifier?: string;
  /**
   * A URI for the license used for the API. This MUST be in the form of a
   * URI. The `url` field is mutually exclusive of the `identifier` field.
   */
  url?: string;
}

/**
 * Holds a set of reusable objects for different aspects of the OAS. All
 * objects defined within the Components Object will have no effect on the API
 * unless they are explicitly referenced from outside the Components Object.
 *
 * All the fixed fields are objects whose keys MUST match the regular
 * expression `^[a-zA-Z0-9\.\-_]+$`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#components-object}
 */
export interface ComponentsObject extends SpecificationExtensions {
  /**
   * An object to hold reusable Schema Objects. Note that the values are not
   * unioned with the Reference Object: in OpenAPI 3.1, `$ref` is a JSON
   * Schema keyword of the Schema Object itself.
   */
  schemas?: Record<string, SchemaObject>;
  /**
   * An object to hold reusable Response Objects.
   */
  responses?: Record<string, ResponseObject | ReferenceObject>;
  /**
   * An object to hold reusable Parameter Objects.
   */
  parameters?: Record<string, ParameterObject | ReferenceObject>;
  /**
   * An object to hold reusable Example Objects.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * An object to hold reusable Request Body Objects.
   */
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
  /**
   * An object to hold reusable Header Objects.
   */
  headers?: Record<string, HeaderObject | ReferenceObject>;
  /**
   * An object to hold reusable Security Scheme Objects.
   */
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
  /**
   * An object to hold reusable Link Objects.
   */
  links?: Record<string, LinkObject | ReferenceObject>;
  /**
   * An object to hold reusable Callback Objects.
   */
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  /**
   * An object to hold reusable Path Item Objects. Note that the values are
   * not unioned with the Reference Object: the Path Item Object has its own
   * `$ref` field.
   */
  pathItems?: Record<string, PathItemObject>;
}

/**
 * Holds the relative paths to the individual endpoints and their operations.
 * The path is appended to the URL from the Server Object in order to
 * construct the full URL. The Paths Object MAY be empty, due to Access
 * Control List (ACL) constraints.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#paths-object}
 */
export interface PathsObject extends SpecificationExtensions {
  /**
   * A relative path to an individual endpoint. The field name MUST begin with
   * a forward slash (`/`). The path is appended (no relative URL resolution)
   * to the expanded URL from the Server Object's `url` field in order to
   * construct the full URL. Path templating is allowed. When matching URLs,
   * concrete (non-templated) paths would be matched before their templated
   * counterparts. Templated paths with the same hierarchy but different
   * templated names MUST NOT exist as they are identical. In case of
   * ambiguous matching, it is up to the tooling to decide which one to use.
   */
  [path: `/${string}`]: PathItemObject;
}

/**
 * Describes the operations available on a single path. A Path Item MAY be
 * empty, due to ACL constraints. The path itself is still exposed to the
 * documentation viewer but they will not know which operations and parameters
 * are available.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#path-item-object}
 */
export interface PathItemObject extends SpecificationExtensions {
  /**
   * Allows for a referenced definition of this path item. The value MUST be
   * in the form of a URI, and the referenced structure MUST be in the form of
   * a Path Item Object. In case a Path Item Object field appears both in the
   * defined object and the referenced object, the behavior is undefined. Note
   * that the behavior of `$ref` with adjacent properties is likely to change
   * in future versions of this specification to bring it into closer
   * alignment with the behavior of the Reference Object.
   */
  $ref?: string;
  /**
   * An optional string summary, intended to apply to all operations in this
   * path.
   */
  summary?: string;
  /**
   * An optional string description, intended to apply to all operations in
   * this path. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * A definition of a GET operation on this path.
   */
  get?: OperationObject;
  /**
   * A definition of a PUT operation on this path.
   */
  put?: OperationObject;
  /**
   * A definition of a POST operation on this path.
   */
  post?: OperationObject;
  /**
   * A definition of a DELETE operation on this path.
   */
  delete?: OperationObject;
  /**
   * A definition of an OPTIONS operation on this path.
   */
  options?: OperationObject;
  /**
   * A definition of a HEAD operation on this path.
   */
  head?: OperationObject;
  /**
   * A definition of a PATCH operation on this path.
   */
  patch?: OperationObject;
  /**
   * A definition of a TRACE operation on this path.
   */
  trace?: OperationObject;
  /**
   * An alternative `servers` array to service all operations in this path.
   * If a `servers` array is specified at the OpenAPI Object level, it will be
   * overridden by this value.
   */
  servers?: ServerObject[];
  /**
   * A list of parameters that are applicable for all the operations described
   * under this path. These parameters can be overridden at the operation
   * level, but cannot be removed there. The list MUST NOT include duplicated
   * parameters; a unique parameter is defined by a combination of a name and
   * location. The list can use the Reference Object to link to parameters
   * defined in the Components Object's `parameters`.
   */
  parameters?: (ParameterObject | ReferenceObject)[];
}

/**
 * Describes a single API operation on a path.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#operation-object}
 */
export interface OperationObject extends SpecificationExtensions {
  /**
   * A list of tags for API documentation control. Tags can be used for
   * logical grouping of operations by resources or any other qualifier.
   */
  tags?: string[];
  /**
   * A short summary of what the operation does.
   */
  summary?: string;
  /**
   * A verbose explanation of the operation behavior. CommonMark syntax MAY be
   * used for rich text representation.
   */
  description?: string;
  /**
   * Additional external documentation for this operation.
   */
  externalDocs?: ExternalDocumentationObject;
  /**
   * Unique string used to identify the operation. The id MUST be unique among
   * all operations described in the API. The `operationId` value is
   * case-sensitive. Tools and libraries MAY use the `operationId` to uniquely
   * identify an operation, therefore, it is RECOMMENDED to follow common
   * programming naming conventions.
   */
  operationId?: string;
  /**
   * A list of parameters that are applicable for this operation. If a
   * parameter is already defined in the Path Item, the new definition will
   * override it but can never remove it. The list MUST NOT include duplicated
   * parameters; a unique parameter is defined by a combination of a name and
   * location. The list can use the Reference Object to link to parameters
   * defined in the Components Object's `parameters`.
   */
  parameters?: (ParameterObject | ReferenceObject)[];
  /**
   * The request body applicable for this operation. The `requestBody` is
   * fully supported in HTTP methods where the HTTP 1.1 specification RFC7231
   * has explicitly defined semantics for request bodies. In other cases where
   * the HTTP spec is vague (such as GET, HEAD and DELETE), `requestBody` is
   * permitted but does not have well-defined semantics and SHOULD be avoided
   * if possible.
   */
  requestBody?: RequestBodyObject | ReferenceObject;
  /**
   * The list of possible responses as they are returned from executing this
   * operation.
   */
  responses?: ResponsesObject;
  /**
   * A map of possible out-of band callbacks related to the parent operation.
   * The key is a unique identifier for the Callback Object. Each value in the
   * map is a Callback Object that describes a request that may be initiated
   * by the API provider and the expected responses.
   */
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  /**
   * Declares this operation to be deprecated. Consumers SHOULD refrain from
   * usage of the declared operation.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * A declaration of which security mechanisms can be used for this
   * operation. Only one of the Security Requirement Objects needs to be
   * satisfied to authorize a request. To make security optional, an empty
   * security requirement (`{}`) can be included in the array. This definition
   * overrides any declared top-level `security`. To remove a top-level
   * security declaration, an empty array can be used.
   */
  security?: SecurityRequirementObject[];
  /**
   * An alternative `servers` array to service this operation. If a `servers`
   * array is specified at the Path Item Object or OpenAPI Object level, it
   * will be overridden by this value.
   */
  servers?: ServerObject[];
}

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * Parameter Objects MUST include either a `content` field or a `schema`
 * field, but not both. The `style`, `explode`, `allowReserved`, `example`,
 * and `examples` fields are for use with `schema`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#parameter-object}
 */
export interface ParameterObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the parameter. Parameter names are case sensitive.
   *
   * - If `in` is `"path"`, the `name` field MUST correspond to a template
   *   expression occurring within the path field in the Paths Object.
   * - If `in` is `"header"` and the `name` field is `"Accept"`,
   *   `"Content-Type"` or `"Authorization"`, the parameter definition SHALL
   *   be ignored.
   * - For all other cases, the `name` corresponds to the parameter name used
   *   by the `in` field.
   */
  name: string;
  /**
   * REQUIRED. The location of the parameter. Possible values are `"query"`,
   * `"header"`, `"path"` or `"cookie"`.
   */
  in: ParameterLocation;
  /**
   * A brief description of the parameter. This could contain examples of use.
   * CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Determines whether this parameter is mandatory. If the parameter location
   * is `"path"`, this field is REQUIRED and its value MUST be `true`.
   * Otherwise, the field MAY be included and its default value is `false`.
   *
   * @default false
   */
  required?: boolean;
  /**
   * Specifies that a parameter is deprecated and SHOULD be transitioned out
   * of usage.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * If `true`, clients MAY pass a zero-length string value in place of
   * parameters that would otherwise be omitted entirely, which the server
   * SHOULD interpret as the parameter being unused. If `style` is used, and
   * if behavior is n/a (cannot be serialized), the value SHALL be ignored.
   * This field is valid only for `query` parameters. Use of this field is NOT
   * RECOMMENDED, and it is likely to be removed in a later revision.
   *
   * @default false
   */
  allowEmptyValue?: boolean;
  /**
   * Describes how the parameter value will be serialized depending on the
   * type of the parameter value. Default values (based on value of `in`): for
   * `"query"` - `"form"`; for `"path"` - `"simple"`; for `"header"` -
   * `"simple"`; for `"cookie"` - `"form"`.
   */
  style?: ParameterStyle;
  /**
   * When true, parameter values of type `array` or `object` generate separate
   * parameters for each value of the array or key-value pair of the map. For
   * other types of parameters this field has no effect. When `style` is
   * `"form"`, the default value is `true`; for all other styles, the default
   * value is `false`. Note that despite `false` being the default for
   * `deepObject`, the combination of `false` with `deepObject` is undefined.
   */
  explode?: boolean;
  /**
   * When true, parameter values are serialized using reserved expansion, as
   * defined by RFC6570, which allows RFC3986's reserved character set, as
   * well as percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters. Applications are still
   * responsible for percent-encoding reserved characters that are not allowed
   * in the query string (`[`, `]`, `#`), or have a special meaning in
   * `application/x-www-form-urlencoded` (`-`, `&`, `+`). This field only
   * applies to parameters with an `in` value of `query`.
   *
   * @default false
   */
  allowReserved?: boolean;
  /**
   * The schema defining the type used for the parameter.
   */
  schema?: SchemaObject;
  /**
   * Example of the parameter's potential value. The example SHOULD match the
   * specified schema and follow the prescribed serialization strategy for the
   * parameter. The `example` field is mutually exclusive of the `examples`
   * field. Furthermore, if referencing a `schema` that contains an example,
   * the `example` value SHALL override the example provided by the schema.
   */
  example?: unknown;
  /**
   * Examples of the parameter's potential value. Each example SHOULD contain
   * a value in the correct format as specified in the parameter encoding. The
   * `examples` field is mutually exclusive of the `example` field.
   * Furthermore, if referencing a `schema` that contains an example, the
   * `examples` value SHALL override the example provided by the schema.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map containing the representations for the parameter. The key is the
   * media type and the value describes it. The map MUST only contain one
   * entry.
   */
  content?: Record<string, MediaTypeObject>;
}

/**
 * Describes a single request body.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#request-body-object}
 */
export interface RequestBodyObject extends SpecificationExtensions {
  /**
   * A brief description of the request body. This could contain examples of
   * use. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * REQUIRED. The content of the request body. The key is a media type or
   * media type range and the value describes it. For requests that match
   * multiple keys, only the most specific key is applicable, e.g.
   * `"text/plain"` overrides `"text/*"`. The map SHOULD have at least one
   * entry; if it does not, the behavior is implementation-defined.
   */
  content: Record<string, MediaTypeObject>;
  /**
   * Determines if the request body is required in the request.
   *
   * @default false
   */
  required?: boolean;
}

/**
 * Each Media Type Object provides schema and examples for the media type
 * identified by its key.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#media-type-object}
 */
export interface MediaTypeObject extends SpecificationExtensions {
  /**
   * The schema defining the content of the request, response, parameter, or
   * header. Binary content (e.g. `image/png`, `application/octet-stream`) MAY
   * omit `schema` entirely; encoded binary data is modeled with JSON Schema's
   * `contentEncoding` and `contentMediaType` keywords rather than the 3.0
   * `format` values `byte` and `binary`.
   */
  schema?: SchemaObject;
  /**
   * Example of the media type. The example SHOULD match the specified schema
   * and be in the correct format as specified by the media type and its
   * encoding. The `example` field is mutually exclusive of the `examples`
   * field. Furthermore, if referencing a `schema` that contains an example,
   * the `example` value SHALL override the example provided by the schema.
   */
  example?: unknown;
  /**
   * Examples of the media type. Each example SHOULD match the specified
   * schema and be in the correct format as specified by the media type and
   * its encoding. The `examples` field is mutually exclusive of the `example`
   * field. Furthermore, if referencing a `schema` that contains an example,
   * the `examples` value SHALL override the example provided by the schema.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map between a property name and its encoding information. The key,
   * being the property name, MUST exist in the schema as a property. The
   * `encoding` field SHALL only apply to Request Body Objects, and only when
   * the media type is `multipart` or `application/x-www-form-urlencoded`. If
   * no Encoding Object is provided for a property, the behavior is determined
   * by the default values documented for the Encoding Object.
   */
  encoding?: Record<string, EncodingObject>;
}

/**
 * A single encoding definition applied to a single schema property.
 *
 * Properties are correlated with `multipart` parts via the `name` parameter
 * of `Content-Disposition: form-data`, and with `application/x-www-form-urlencoded`
 * via query string parameter names; ordering is implementation-defined.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#encoding-object}
 */
export interface EncodingObject extends SpecificationExtensions {
  /**
   * The `Content-Type` for encoding a specific property. The value is a
   * comma-separated list, each element of which is either a specific media
   * type (e.g. `image/png`) or a wildcard media type (e.g. `image/*`).
   * Default value depends on the property type: for a schema with absent
   * `type` – `application/octet-stream`; for `string` with `contentEncoding`
   * present – `application/octet-stream`; for `string` without
   * `contentEncoding`, and for `number`, `integer`, or `boolean` –
   * `text/plain`; for `object` – `application/json`; for `array` – according
   * to the `type` of the `items` schema.
   */
  contentType?: string;
  /**
   * A map allowing additional information to be provided as headers.
   * `Content-Type` is described separately and SHALL be ignored in this
   * section. This field SHALL be ignored if the request body media type is
   * not a `multipart`.
   */
  headers?: Record<string, HeaderObject | ReferenceObject>;
  /**
   * Describes how a specific property value will be serialized depending on
   * its type. See Parameter Object for details on the `style` field. The
   * behavior follows the same values as `query` parameters, including default
   * values, noting that the default of `"form"` applies only when
   * `contentType` is not being used due to `explode` or `allowReserved` being
   * explicitly specified. The initial `?` used in query strings MUST NOT
   * appear in `application/x-www-form-urlencoded` message bodies. This field
   * SHALL be ignored if the request body media type is not
   * `application/x-www-form-urlencoded` or `multipart/form-data`. If a value
   * is explicitly defined, then the value of `contentType` (implicit or
   * explicit) SHALL be ignored.
   */
  style?: QueryParameterStyle;
  /**
   * When true, property values of type `array` or `object` generate separate
   * parameters for each value of the array, or key-value-pair of the map. For
   * other types of properties this field has no effect. When `style` is
   * `"form"`, the default value is `true`; for all other styles, the default
   * value is `false`. This field SHALL be ignored if the request body media
   * type is not `application/x-www-form-urlencoded` or `multipart/form-data`.
   * If a value is explicitly defined, then the value of `contentType`
   * (implicit or explicit) SHALL be ignored.
   */
  explode?: boolean;
  /**
   * When true, parameter values are serialized using reserved expansion, as
   * defined by RFC6570, which allows RFC3986's reserved character set, as
   * well as percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters. Applications are still
   * responsible for percent-encoding reserved characters that are not allowed
   * in the query string (`[`, `]`, `#`), or have a special meaning in
   * `application/x-www-form-urlencoded` (`-`, `&`, `+`). This field SHALL be
   * ignored if the request body media type is not
   * `application/x-www-form-urlencoded` or `multipart/form-data`. If a value
   * is explicitly defined, then the value of `contentType` (implicit or
   * explicit) SHALL be ignored.
   *
   * @default false
   */
  allowReserved?: boolean;
}

/**
 * A container for the expected responses of an operation. The container maps
 * a HTTP response code to the expected response.
 *
 * The Responses Object MUST contain at least one response code, and if only
 * one response code is provided it SHOULD be the response for a successful
 * operation call.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#responses-object}
 */
export interface ResponsesObject extends SpecificationExtensions {
  /**
   * The documentation of responses other than the ones declared for specific
   * HTTP response codes. Use this field to cover undeclared responses.
   */
  default?: ResponseObject | ReferenceObject;
  /**
   * Any HTTP status code can be used as the property name, but only one
   * property per code, to describe the expected response for that HTTP status
   * code. This field MUST be enclosed in quotation marks (for example, "200")
   * for compatibility between JSON and YAML. To define a range of response
   * codes, this field MAY contain the uppercase wildcard character `X`. For
   * example, `2XX` represents all response codes between `200` and `299`.
   * Only the following range definitions are allowed: `1XX`, `2XX`, `3XX`,
   * `4XX`, and `5XX`. If a response is defined using an explicit code, the
   * explicit code definition takes precedence over the range definition for
   * that code.
   */
  [statusCode: `${1 | 2 | 3 | 4 | 5}${string}`]:
    | ResponseObject
    | ReferenceObject;
}

/**
 * Describes a single response from an API operation, including design-time,
 * static `links` to operations based on the response.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#response-object}
 */
export interface ResponseObject extends SpecificationExtensions {
  /**
   * REQUIRED. A description of the response. CommonMark syntax MAY be used
   * for rich text representation.
   */
  description: string;
  /**
   * Maps a header name to its definition. RFC7230 states header names are
   * case insensitive. If a response header is defined with the name
   * `"Content-Type"`, it SHALL be ignored.
   */
  headers?: Record<string, HeaderObject | ReferenceObject>;
  /**
   * A map containing descriptions of potential response payloads. The key is
   * a media type or media type range and the value describes it. For
   * responses that match multiple keys, only the most specific key is
   * applicable, e.g. `"text/plain"` overrides `"text/*"`.
   */
  content?: Record<string, MediaTypeObject>;
  /**
   * A map of operations links that can be followed from the response. The key
   * of the map is a short name for the link, following the naming constraints
   * of the names for Component Objects (`^[a-zA-Z0-9\.\-_]+$`).
   */
  links?: Record<string, LinkObject | ReferenceObject>;
}

/**
 * A map of possible out-of-band callbacks related to the parent operation.
 * Each value in the map is a Path Item Object that describes a set of
 * requests that may be initiated by the API provider and the expected
 * responses. To describe incoming requests from the API provider independent
 * from another API call, use the OpenAPI Object's `webhooks` field.
 *
 * Note: this object MAY be extended with Specification Extensions (`x-`
 * prefixed fields), which cannot be represented in TypeScript alongside the
 * arbitrary runtime-expression keys.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#callback-object}
 */
export interface CallbackObject {
  /**
   * A Path Item Object used to define a callback request and expected
   * responses. The key is a runtime expression, evaluated in the context of a
   * runtime HTTP request/response, that identifies the URL to be used for the
   * callback request (e.g. `$request.body#/url`); expressions can be embedded
   * into string values by surrounding them with `{}` curly braces.
   */
  [expression: string]: PathItemObject;
}

/**
 * Describes a single header for HTTP responses and for individual parts in
 * multipart representations.
 *
 * The Header Object follows the structure of the Parameter Object, including
 * determining its serialization strategy based on whether `schema` or
 * `content` is present (mutually exclusive), with these changes: `name` MUST
 * NOT be specified, it is given in the corresponding `headers` map; `in` MUST
 * NOT be specified, it is implicitly in `header`; all traits that are
 * affected by the location MUST be applicable to a location of `header` —
 * `allowEmptyValue` and `allowReserved` MUST NOT be used, and `style`, if
 * used, MUST be limited to `"simple"`.
 *
 * When serializing with `schema`, URI percent-encoding MUST NOT be applied
 * and header values MUST be passed through unchanged (no automatic quoting).
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#header-object}
 */
export interface HeaderObject extends SpecificationExtensions {
  /**
   * A brief description of the header. This could contain examples of use.
   * CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Determines whether this header is mandatory.
   *
   * @default false
   */
  required?: boolean;
  /**
   * Specifies that the header is deprecated and SHOULD be transitioned out of
   * usage.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * Describes how the header value will be serialized. The default (and only
   * legal value for headers) is `"simple"`.
   *
   * @default "simple"
   */
  style?: "simple";
  /**
   * When true, header values of type `array` or `object` generate a single
   * header whose value is a comma-separated list of the array items or
   * key-value pairs of the map. For other data types this field has no
   * effect.
   *
   * @default false
   */
  explode?: boolean;
  /**
   * The schema defining the type used for the header.
   */
  schema?: SchemaObject;
  /**
   * Example of the header's potential value. The example SHOULD match the
   * specified schema and follow the prescribed serialization strategy for the
   * header. The `example` field is mutually exclusive of the `examples`
   * field. Furthermore, if referencing a `schema` that contains an example,
   * the `example` value SHALL override the example provided by the schema.
   */
  example?: unknown;
  /**
   * Examples of the header's potential value. Each example SHOULD contain a
   * value in the correct format as specified in the header encoding. The
   * `examples` field is mutually exclusive of the `example` field.
   * Furthermore, if referencing a `schema` that contains an example, the
   * `examples` value SHALL override the example provided by the schema.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map containing the representations for the header. The key is the media
   * type and the value describes it. The map MUST only contain one entry.
   */
  content?: Record<string, MediaTypeObject>;
}

/**
 * A simple object to allow referencing other components in the OpenAPI
 * Description, internally and externally.
 *
 * This object cannot be extended with additional properties, and any
 * properties added SHALL be ignored. Note that this restriction on additional
 * properties is a difference between Reference Objects and Schema Objects
 * that contain a `$ref` keyword.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#reference-object}
 */
export interface ReferenceObject {
  /**
   * REQUIRED. The reference identifier. This MUST be in the form of a URI.
   */
  $ref: string;
  /**
   * A short summary which by default SHOULD override that of the referenced
   * component. If the referenced object-type does not allow a `summary`
   * field, then this field has no effect.
   */
  summary?: string;
  /**
   * A description which by default SHOULD override that of the referenced
   * component. CommonMark syntax MAY be used for rich text representation. If
   * the referenced object-type does not allow a `description` field, then
   * this field has no effect.
   */
  description?: string;
}

/**
 * The data type of a schema. In OpenAPI 3.1 (JSON Schema Draft 2020-12),
 * `"null"` is a first-class type, and the Schema Object's `type` keyword also
 * accepts an array of unique types.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#data-types}
 */
export type SchemaObjectType =
  | "array"
  | "boolean"
  | "integer"
  | "null"
  | "number"
  | "object"
  | "string";

/**
 * The object form of the Schema Object: every JSON Schema Draft 2020-12
 * keyword, plus the OAS base vocabulary (`discriminator`, `xml`,
 * `externalDocs`, `example`).
 *
 * In addition to these keywords, the Schema Object supports keywords from any
 * other vocabularies, or entirely arbitrary properties (extensions inside
 * Schema Objects MAY omit the `x-` prefix).
 *
 * @template T The type of the data instances this schema describes, applied
 * to the `enum`, `const`, `default`, `examples`, and `example` fields.
 * Defaults to `unknown`; subschema positions (`properties`, `items`, ...) are
 * not parameterized.
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#schema-object}
 */
export interface SchemaObjectFields<T = unknown> {
  /**
   * In addition to the JSON Schema keywords comprising the OAS dialect, the
   * Schema Object supports keywords from any other vocabularies, or entirely
   * arbitrary properties. Unlike the other objects of this specification,
   * extensions MAY omit the `x-` prefix within this object.
   */
  [keyword: string]: unknown; // oxlint-disable-line anti-slop/no-unsafe-dictionary-type -- the specification allows arbitrary keywords with any value here

  // JSON Schema Core vocabulary

  /**
   * The URI of the dialect (meta-schema) this schema conforms to. MAY be
   * present in any schema resource root, and if present MUST be used to
   * determine the dialect. Tooling MUST support the OAS dialect schema id
   * `https://spec.openapis.org/oas/3.1/dialect/base`, and MAY support
   * additional values. The OpenAPI Object's `jsonSchemaDialect` field sets
   * the default; if it is also unset, the OAS dialect schema id MUST be used.
   */
  $schema?: string;
  /**
   * A URI identifying the schema resource. The nearest parent `$id` serves as
   * the base URI for relative references within the schema.
   */
  $id?: string;
  /**
   * A URI reference to a schema to apply at this location. Unlike the
   * Reference Object, `$ref` here is a plain JSON Schema keyword: adjacent
   * keywords are allowed and are evaluated normally.
   */
  $ref?: string;
  /**
   * A plain-name fragment identifier for the enclosing schema, usable as a
   * `$ref` target.
   */
  $anchor?: string;
  /**
   * A URI reference that, together with `$dynamicAnchor`, MAY be used to
   * implement generic or template data structures: `$dynamicRef` resolves to
   * the first matching `$dynamicAnchor` in the dynamic scope from the schema
   * entry point.
   */
  $dynamicRef?: string;
  /**
   * A plain-name fragment identifier that is a candidate target for
   * `$dynamicRef` resolution.
   */
  $dynamicAnchor?: string;
  /**
   * A map of vocabulary URIs to booleans declaring which vocabularies are
   * required (`true`) or optional (`false`) to process the schema. Only
   * meaningful in a meta-schema.
   */
  $vocabulary?: Record<string, boolean>;
  /**
   * Reusable subschema definitions, addressable via `$ref`.
   */
  $defs?: Record<string, SchemaObject>;
  /**
   * A comment for schema maintainers, carrying no validation semantics.
   */
  $comment?: string;

  // JSON Schema Applicator vocabulary

  /**
   * An instance is valid against this keyword if it is valid against all
   * subschemas in this array. `allOf` offers model composition; with
   * `discriminator`, polymorphism.
   */
  allOf?: SchemaObject[];
  /**
   * An instance is valid against this keyword if it is valid against exactly
   * one subschema in this array.
   */
  oneOf?: SchemaObject[];
  /**
   * An instance is valid against this keyword if it is valid against at least
   * one subschema in this array.
   */
  anyOf?: SchemaObject[];
  /**
   * An instance is valid against this keyword if it is not valid against the
   * given subschema.
   */
  not?: SchemaObject;
  /**
   * If the instance validates against this subschema, it must also validate
   * against `then` (if present); otherwise against `else` (if present).
   */
  if?: SchemaObject;
  /**
   * Applied when the instance validates against `if`.
   */
  then?: SchemaObject;
  /**
   * Applied when the instance fails validation against `if`.
   */
  else?: SchemaObject;
  /**
   * A map of property names to subschemas that the whole instance must
   * validate against when the named property is present.
   */
  dependentSchemas?: Record<string, SchemaObject>;
  /**
   * An array of subschemas applied positionally to the first items of an
   * array instance (tuple validation).
   */
  prefixItems?: SchemaObject[];
  /**
   * A subschema applied to all array items not covered by `prefixItems`
   * (tuples use `prefixItems`). Unlike OpenAPI 3.0, `items` is not required
   * when `type` is `"array"`.
   */
  items?: SchemaObject;
  /**
   * An array instance is valid if at least one item (subject to
   * `minContains`/`maxContains`) validates against this subschema.
   */
  contains?: SchemaObject;
  /**
   * A map of property names to subschemas validating the corresponding
   * property values of an object instance.
   */
  properties?: Record<string, SchemaObject>;
  /**
   * A map of ECMA-262 regular expressions to subschemas validating the values
   * of all properties whose names match each expression.
   */
  patternProperties?: Record<string, SchemaObject>;
  /**
   * A subschema applied to the values of all object properties not covered by
   * `properties` or `patternProperties`.
   */
  additionalProperties?: SchemaObject;
  /**
   * A subschema every property name of an object instance must validate
   * against.
   */
  propertyNames?: SchemaObject;

  // JSON Schema Unevaluated vocabulary

  /**
   * A subschema applied to array items not successfully evaluated by any
   * `prefixItems`, `items`, or `contains` in this schema or its subschemas.
   */
  unevaluatedItems?: SchemaObject;
  /**
   * A subschema applied to object properties not successfully evaluated by
   * any `properties`, `patternProperties`, or `additionalProperties` in this
   * schema or its subschemas.
   */
  unevaluatedProperties?: SchemaObject;

  // JSON Schema Validation vocabulary

  /**
   * The data type of the schema: a string or an array of unique strings.
   * `"null"` is a first-class type value (replacing OpenAPI 3.0's `nullable`
   * keyword, e.g. `type: ["string", "null"]`). Note that keywords and formats
   * do not implicitly require the expected type; use `type` to constrain it.
   */
  type?: SchemaObjectType | SchemaObjectType[];
  /**
   * The instance is valid only if its value equals one of the elements in
   * this array.
   */
  enum?: T[];
  /**
   * The instance is valid only if its value equals this value.
   */
  const?: T;
  /**
   * A numeric instance is valid only if division by this keyword's value
   * results in an integer. MUST be a number strictly greater than 0.
   */
  multipleOf?: number;
  /**
   * An inclusive upper limit for a numeric instance.
   */
  maximum?: number;
  /**
   * An exclusive upper limit for a numeric instance. Note that unlike OpenAPI
   * 3.0, this is a standalone numeric limit, not a boolean modifying
   * `maximum`.
   */
  exclusiveMaximum?: number;
  /**
   * An inclusive lower limit for a numeric instance.
   */
  minimum?: number;
  /**
   * An exclusive lower limit for a numeric instance. Note that unlike OpenAPI
   * 3.0, this is a standalone numeric limit, not a boolean modifying
   * `minimum`.
   */
  exclusiveMinimum?: number;
  /**
   * The maximum length of a string instance. MUST be a non-negative integer.
   * MAY be used to set an expected upper bound on the length of a streaming
   * payload; for unencoded binary data the length is the number of octets.
   */
  maxLength?: number;
  /**
   * The minimum length of a string instance. MUST be a non-negative integer.
   *
   * @default 0
   */
  minLength?: number;
  /**
   * A string instance is valid if the ECMA-262 regular expression matches it.
   */
  pattern?: string;
  /**
   * The maximum number of items in an array instance. MUST be a non-negative
   * integer.
   */
  maxItems?: number;
  /**
   * The minimum number of items in an array instance. MUST be a non-negative
   * integer.
   *
   * @default 0
   */
  minItems?: number;
  /**
   * If `true`, all items in an array instance must be unique.
   *
   * @default false
   */
  uniqueItems?: boolean;
  /**
   * The maximum number of items matching `contains`. MUST be a non-negative
   * integer.
   */
  maxContains?: number;
  /**
   * The minimum number of items matching `contains`. MUST be a non-negative
   * integer.
   *
   * @default 1
   */
  minContains?: number;
  /**
   * The maximum number of properties of an object instance. MUST be a
   * non-negative integer.
   */
  maxProperties?: number;
  /**
   * The minimum number of properties of an object instance. MUST be a
   * non-negative integer.
   *
   * @default 0
   */
  minProperties?: number;
  /**
   * Property names that must be present in an object instance. Elements MUST
   * be unique.
   */
  required?: string[];
  /**
   * A map of property names to arrays of property names that must also be
   * present when the key property is present.
   */
  dependentRequired?: Record<string, string[]>;

  // JSON Schema Meta-Data vocabulary

  /**
   * A short title for the schema.
   */
  title?: string;
  /**
   * A description of the schema. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * A default value associated with the schema, as an annotation for
   * documenting the receiver's behavior. Note that unlike OpenAPI 3.0, the
   * value is not required to conform to the schema's `type`.
   */
  default?: T;
  /**
   * Indicates that applications SHOULD refrain from using the described
   * value(s).
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * Indicates the value is managed by the owning authority: it MAY be sent in
   * a response but SHOULD NOT be sent in a request. Note that the behavior of
   * `readOnly` in particular differs from that of OpenAPI 3.0: per JSON
   * Schema Validation Draft 2020-12 §9.4, the owning authority MAY either
   * ignore a `readOnly` field sent in a request or treat it as an error.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * Indicates the value may be sent in a request but SHOULD NOT be included
   * in a response.
   *
   * @default false
   */
  writeOnly?: boolean;
  /**
   * An array of example values associated with the schema. This is the
   * preferred, JSON-Schema-native way to include examples in a Schema Object,
   * replacing the OAS-specific singular `example`.
   */
  examples?: T[];

  // JSON Schema Format-Annotation vocabulary

  /**
   * The format of the data type. While relying on JSON Schema's defined
   * formats, the OAS offers a few additional predefined formats: `"int32"`,
   * `"int64"`, `"float"`, `"double"` (with `type: "number"`), and
   * `"password"` (a hint to obscure the value, with `type: "string"`).
   * `format` is a non-validating annotation by default; tools that do not
   * recognize a format MAY default back to `type` alone. Support for any
   * format registered in the OpenAPI Format Registry is strictly OPTIONAL.
   */
  format?: string;

  // JSON Schema Content vocabulary

  /**
   * The encoding (e.g. `base64`, `base64url`) used to represent binary data
   * as a string instance, replacing the OpenAPI 3.0 `format: "byte"` usage.
   * Raw binary data (OpenAPI 3.0 `format: "binary"`) is instead represented
   * by omitting `type` and `contentEncoding` and using `contentMediaType`.
   * Treated as an annotation rather than validated directly.
   */
  contentEncoding?: string;
  /**
   * The media type of the content of a string instance. Redundant if the
   * media type is already set as the Media Type Object's key or in an
   * Encoding Object's `contentType`, and SHALL be ignored if it contradicts
   * them. Treated as an annotation rather than validated directly.
   */
  contentMediaType?: string;
  /**
   * A subschema describing the structure of the string's decoded content.
   * Treated as an annotation rather than validated directly.
   */
  contentSchema?: SchemaObject;

  // OAS base vocabulary

  /**
   * Adds support for polymorphism. The discriminator is used to determine
   * which of a set of schemas a payload is expected to satisfy. The
   * discriminator property SHOULD be a required field of the payload schema.
   * Legal only when using one of the composite keywords `oneOf`, `anyOf`,
   * `allOf`; MUST NOT change the validation outcome.
   */
  discriminator?: DiscriminatorObject;
  /**
   * This MAY be used only on property schemas; it has no effect on root
   * schemas. Adds additional metadata to describe the XML representation of
   * this property.
   */
  xml?: XMLObject;
  /**
   * Additional external documentation for this schema.
   */
  externalDocs?: ExternalDocumentationObject;
  /**
   * A free-form field to include an example of an instance for this schema.
   * To represent examples that cannot be naturally represented in JSON or
   * YAML, a string value can be used to contain the example with escaping
   * where necessary.
   *
   * @deprecated The `example` field has been deprecated in favor of the JSON
   * Schema `examples` keyword. Use of `example` is discouraged, and later
   * versions of this specification may remove it.
   */
  example?: T;
}

/**
 * The Schema Object allows the definition of input and output data types.
 * These types can be objects, but also primitives and arrays. This object is
 * a superset of the JSON Schema Specification Draft 2020-12.
 *
 * The empty schema (which allows any instance to validate) MAY be represented
 * by the boolean value `true`, and a schema which allows no instance to
 * validate MAY be represented by the boolean value `false`.
 *
 * Unless stated otherwise, the keyword definitions follow those of JSON
 * Schema and do not add any additional semantics. The OpenAPI Schema Object
 * dialect is identified by the URI `https://spec.openapis.org/oas/3.1/dialect/base`
 * (the "OAS dialect schema id"), and requires the OAS base vocabulary
 * (`discriminator`, `xml`, `externalDocs`, `example`) in addition to the
 * vocabularies of the JSON Schema Draft 2020-12 general-purpose meta-schema.
 *
 * @template T The type of the data instances this schema describes, applied
 * to the `enum`, `const`, `default`, `examples`, and `example` fields.
 * Defaults to `unknown`.
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#schema-object}
 */
export type SchemaObject<T = unknown> = boolean | SchemaObjectFields<T>;

/**
 * When request bodies or response payloads may be one of a number of
 * different schemas, a Discriminator Object gives a hint about the expected
 * schema of the document. This hint can be used to aid in serialization,
 * deserialization, and validation.
 *
 * The Discriminator Object is legal only when using one of the composite
 * keywords `oneOf`, `anyOf`, `allOf`. Note that `discriminator` MUST NOT
 * change the validation outcome of the schema.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#discriminator-object}
 */
export interface DiscriminatorObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the property in the payload that will hold the
   * discriminating value. This property SHOULD be required in the payload
   * schema, as the behavior when the property is absent is undefined.
   */
  propertyName: string;
  /**
   * An object to hold mappings between payload values and schema names or URI
   * references. The value of the property named in `propertyName` is used as
   * the name of the associated schema under the Components Object unless a
   * `mapping` is present for that value. To force a value to be treated as a
   * relative URI reference rather than a schema name, authors MUST prefix it
   * with the `"."` path segment (e.g. `"./foo"`). Mapping keys MUST be string
   * values.
   */
  mapping?: Record<string, string>;
}

/**
 * The type of a security scheme. OpenAPI 3.1 adds `"mutualTLS"`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#security-scheme-object}
 */
export type SecuritySchemeType =
  | "apiKey"
  | "http"
  | "mutualTLS"
  | "oauth2"
  | "openIdConnect";

/**
 * Defines a mutual TLS security scheme (use of a client certificate) that can
 * be used by the operations. There are no additional configuration fields.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#security-scheme-object}
 */
export interface MutualTlsSecuritySchemeObject extends SpecificationExtensions {
  /**
   * REQUIRED. The type of the security scheme.
   */
  type: "mutualTLS";
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
}

/**
 * Defines a security scheme that can be used by the operations. Supported
 * schemes are HTTP authentication, an API key (either as a header, a cookie
 * parameter, or as a query parameter), mutual TLS (use of a client
 * certificate), OAuth2's common flows (implicit, password, client credentials,
 * and authorization code) as defined in RFC6749, and OpenID Connect
 * Discovery.
 *
 * The implicit flow is subject to deprecation by the OAuth 2.0 Security Best
 * Current Practice; the Authorization Code Grant flow with PKCE is
 * recommended for most use cases.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#security-scheme-object}
 */
export type SecuritySchemeObject =
  | ApiKeySecuritySchemeObject
  | HttpSecuritySchemeObject
  | MutualTlsSecuritySchemeObject
  | OAuth2SecuritySchemeObject
  | OpenIdConnectSecuritySchemeObject;

/**
 * Lists the required security schemes to execute this operation or the API as
 * a whole. A Security Requirement Object MAY refer to multiple security
 * schemes, in which case all schemes MUST be satisfied for a request to be
 * authorized.
 *
 * When a list of Security Requirement Objects is defined on the OpenAPI
 * Object or Operation Object, only one of the Security Requirement Objects in
 * the list needs to be satisfied to authorize the request. An empty Security
 * Requirement Object (`{}`) indicates anonymous access is supported.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1.2.html#security-requirement-object}
 */
export interface SecurityRequirementObject {
  /**
   * Each name MUST correspond to a security scheme which is declared in the
   * Security Schemes under the Components Object. If the security scheme is
   * of type `"oauth2"` or `"openIdConnect"`, then the value is a list of
   * scope names required for the execution, and the list MAY be empty if
   * authorization does not require a specified scope. For other security
   * scheme types, the array MAY contain a list of role names which are
   * required for the execution, but are not otherwise defined or exchanged
   * in-band.
   */
  [name: string]: string[];
}
