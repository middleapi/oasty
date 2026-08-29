/**
 * TypeScript types for the OpenAPI Specification v3.0, authored against the
 * latest patch release 3.0.4.
 *
 * Type names follow the specification's section names, and every field
 * carries its specification description as JSDoc.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html}
 */

/**
 * While the OpenAPI Specification tries to accommodate most use cases,
 * additional data can be added to extend the specification at certain points.
 * The extension fields are implemented as patterned fields that are always
 * prefixed by `x-`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#specification-extensions}
 */
export interface SpecificationExtensions {
  /**
   * Allows extensions to the OpenAPI Schema. The field name MUST begin with
   * `x-`, for example, `x-internal-id`. The value can be any valid JSON value
   * (`null`, a primitive, an array, or an object).
   */
  [extension: `x-${string}`]: unknown; // oxlint-disable-line anti-slop/no-unsafe-dictionary-type -- the specification allows any JSON value here
}

/**
 * This is the root object of the OpenAPI Description.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#openapi-object}
 */
export interface OpenAPIObject extends SpecificationExtensions {
  /**
   * REQUIRED. This string MUST be the version number of the OpenAPI
   * Specification that the OpenAPI Document uses (`major.minor.patch`, e.g.
   * `"3.0.4"`). The `openapi` field SHOULD be used by tooling to interpret
   * the OpenAPI Document. This is not related to the API `info.version`
   * string.
   */
  openapi: `3.0.${string}`;
  /**
   * REQUIRED. Provides metadata about the API. The metadata MAY be used by
   * tooling as required.
   */
  info: InfoObject;
  /**
   * An array of Server Objects, which provide connectivity information to a
   * target server. If the `servers` field is not provided, or is an empty
   * array, the default value would be a Server Object with a `url` value of
   * `/`.
   */
  servers?: ServerObject[];
  /**
   * REQUIRED. The available paths and operations for the API.
   */
  paths: PathsObject;
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#info-object}
 */
export interface InfoObject extends SpecificationExtensions {
  /**
   * REQUIRED. The title of the API.
   */
  title: string;
  /**
   * A description of the API. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * A URL for the Terms of Service for the API. This MUST be in the form of a
   * URL.
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
 * Contact information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#contact-object}
 */
export interface ContactObject extends SpecificationExtensions {
  /**
   * The identifying name of the contact person/organization.
   */
  name?: string;
  /**
   * The URL for the contact information. This MUST be in the form of a URL.
   */
  url?: string;
  /**
   * The email address of the contact person/organization. This MUST be in the
   * form of an email address.
   */
  email?: string;
}

/**
 * License information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#license-object}
 */
export interface LicenseObject extends SpecificationExtensions {
  /**
   * REQUIRED. The license name used for the API.
   */
  name: string;
  /**
   * A URL for the license used for the API. This MUST be in the form of a
   * URL.
   */
  url?: string;
}

/**
 * An object representing a Server.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#server-object}
 */
export interface ServerObject extends SpecificationExtensions {
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables
   * and MAY be relative, to indicate that the host location is relative to
   * the location where the document containing the Server Object is being
   * served. Variable substitutions will be made when a variable is named in
   * `{braces}`.
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#server-variable-object}
 */
export interface ServerVariableObject extends SpecificationExtensions {
  /**
   * An enumeration of string values to be used if the substitution options
   * are from a limited set. The array SHOULD NOT be empty.
   */
  enum?: string[];
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent
   * if an alternate value is not supplied. If the `enum` is defined, the
   * value SHOULD exist in the enum's values. Note that this behavior is
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
 * Holds a set of reusable objects for different aspects of the OAS. All
 * objects defined within the Components Object will have no effect on the API
 * unless they are explicitly referenced from outside the Components Object.
 *
 * All the fixed fields are objects whose keys MUST match the regular
 * expression `^[a-zA-Z0-9\.\-_]+$`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#components-object}
 */
export interface ComponentsObject extends SpecificationExtensions {
  /**
   * An object to hold reusable Schema Objects.
   */
  schemas?: Record<string, SchemaObject | ReferenceObject>;
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
}

/**
 * Holds the relative paths to the individual endpoints and their operations.
 * The path is appended to the URL from the Server Object in order to
 * construct the full URL. The Paths Object MAY be empty, due to Access
 * Control List (ACL) constraints.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#paths-object}
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#path-item-object}
 */
export interface PathItemObject extends SpecificationExtensions {
  /**
   * Allows for a referenced definition of this path item. The value MUST be
   * in the form of a URL, and the referenced structure MUST be in the form of
   * a Path Item Object. In case a Path Item Object field appears both in the
   * defined object and the referenced object, the behavior is undefined.
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
   * A definition of a OPTIONS operation on this path.
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
   * defined in the OpenAPI Object's `components.parameters`.
   */
  parameters?: (ParameterObject | ReferenceObject)[];
}

/**
 * Describes a single API operation on a path.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#operation-object}
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
   * defined in the OpenAPI Object's `components.parameters`.
   */
  parameters?: (ParameterObject | ReferenceObject)[];
  /**
   * The request body applicable for this operation. The `requestBody` is only
   * supported in HTTP methods where the HTTP 1.1 specification RFC7231 has
   * explicitly defined semantics for request bodies. In other cases where the
   * HTTP spec is vague (such as GET, HEAD and DELETE), `requestBody` SHALL be
   * ignored by consumers.
   */
  requestBody?: RequestBodyObject | ReferenceObject;
  /**
   * REQUIRED. The list of possible responses as they are returned from
   * executing this operation.
   */
  responses: ResponsesObject;
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
 * Allows referencing an external resource for extended documentation.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#external-documentation-object}
 */
export interface ExternalDocumentationObject extends SpecificationExtensions {
  /**
   * A description of the target documentation. CommonMark syntax MAY be used
   * for rich text representation.
   */
  description?: string;
  /**
   * REQUIRED. The URL for the target documentation. This MUST be in the form
   * of a URL.
   */
  url: string;
}

/**
 * The location of a parameter.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#parameter-locations}
 */
export type ParameterLocation = "cookie" | "header" | "path" | "query";

/**
 * Describes how a parameter value will be serialized depending on the type of
 * the parameter value. In order to support common ways of serializing simple
 * parameters, a set of `style` values are defined:
 *
 * - `"matrix"` — path-style parameters defined by RFC6570 (`path`).
 * - `"label"` — label style parameters defined by RFC6570 (`path`).
 * - `"simple"` — simple style parameters defined by RFC6570 (`path`,
 *   `header`).
 * - `"form"` — form style parameters defined by RFC6570 (`query`, `cookie`).
 * - `"spaceDelimited"` — space separated array or object values (`query`).
 * - `"pipeDelimited"` — pipe separated array or object values (`query`).
 * - `"deepObject"` — allows objects with scalar properties to be represented
 *   using form parameters; the representation of nested array or object
 *   properties is not defined (`query`).
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#style-values}
 */
export type ParameterStyle =
  | "deepObject"
  | "form"
  | "label"
  | "matrix"
  | "pipeDelimited"
  | "simple"
  | "spaceDelimited";

/**
 * The subset of `style` values that is defined for `query` parameters. The
 * Encoding Object's `style` field follows the same values as `query`
 * parameters.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#style-values}
 */
export type QueryParameterStyle =
  | "deepObject"
  | "form"
  | "pipeDelimited"
  | "spaceDelimited";

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * Parameter Objects MUST include either a `content` field or a `schema`
 * field, but not both. The `style`, `explode`, `allowReserved`, `example`,
 * and `examples` fields are for use with `schema`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#parameter-object}
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
   * percent-encoding all other disallowed characters. This field only applies
   * to parameters with an `in` value of `query`.
   *
   * @default false
   */
  allowReserved?: boolean;
  /**
   * The schema defining the type used for the parameter.
   */
  schema?: SchemaObject | ReferenceObject;
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#request-body-object}
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
   * `"text/plain"` overrides `"text/*"`.
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#media-type-object}
 */
export interface MediaTypeObject extends SpecificationExtensions {
  /**
   * The schema defining the content of the request, response, parameter, or
   * header. When using `multipart` content, a `schema` is REQUIRED to define
   * the input parameters to the operation.
   */
  schema?: SchemaObject | ReferenceObject;
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#encoding-object}
 */
export interface EncodingObject extends SpecificationExtensions {
  /**
   * The `Content-Type` for encoding a specific property. The value is a
   * comma-separated list, each element of which is either a specific media
   * type (e.g. `image/png`) or a wildcard media type (e.g. `image/*`).
   * Default value depends on the property type: for `string` with `format`
   * being `binary` or `byte` – `application/octet-stream`; for other
   * primitive types – `text/plain`; for `object` – `application/json`; for
   * `array` – the default is defined based on the inner type.
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
   * values. Note that the initial `?` used in query strings is not used in
   * `application/x-www-form-urlencoded` message bodies, and MUST be removed
   * or not added. This field SHALL be ignored if the request body media type
   * is not `application/x-www-form-urlencoded`.
   *
   * @default "form"
   */
  style?: QueryParameterStyle;
  /**
   * When true, property values of type `array` or `object` generate separate
   * parameters for each value of the array, or key-value-pair of the map. For
   * other types of properties this field has no effect. When `style` is
   * `"form"`, the default value is `true`; for all other styles, the default
   * value is `false`. This field SHALL be ignored if the request body media
   * type is not `application/x-www-form-urlencoded`.
   */
  explode?: boolean;
  /**
   * When true, parameter values are serialized using reserved expansion, as
   * defined by RFC6570, which allows RFC3986's reserved character set, as
   * well as percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters. This field SHALL be
   * ignored if the request body media type is not
   * `application/x-www-form-urlencoded`.
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#responses-object}
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#response-object}
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
 * responses.
 *
 * Note: this object MAY be extended with Specification Extensions (`x-`
 * prefixed fields), which cannot be represented in TypeScript alongside the
 * arbitrary runtime-expression keys.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#callback-object}
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
 * An object grouping an internal or external example value with basic
 * `summary` and `description` metadata.
 *
 * In all cases, the example value SHOULD be compatible with the schema of its
 * associated value; tooling MAY validate compatibility and reject
 * incompatible examples.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#example-object}
 */
export interface ExampleObject extends SpecificationExtensions {
  /**
   * Short description for the example.
   */
  summary?: string;
  /**
   * Long description for the example. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
  /**
   * Embedded literal example. The `value` field and `externalValue` field are
   * mutually exclusive. To represent examples of media types that cannot
   * naturally be represented in JSON or YAML, use a string value to contain
   * the example, escaping where necessary.
   */
  value?: unknown;
  /**
   * A URL that points to the literal example. This provides the capability to
   * reference examples that cannot easily be included in JSON or YAML
   * documents. The `value` field and `externalValue` field are mutually
   * exclusive.
   */
  externalValue?: string;
}

/**
 * The Link Object represents a possible design-time link for a response. The
 * presence of a link does not guarantee the caller's ability to successfully
 * invoke it, rather it provides a known relationship and traversal mechanism
 * between responses and other operations.
 *
 * A linked operation MUST be identified using either an `operationRef` or
 * `operationId` (mutually exclusive).
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#link-object}
 */
export interface LinkObject extends SpecificationExtensions {
  /**
   * A URI reference to an OAS operation. This field is mutually exclusive of
   * the `operationId` field, and MUST point to an Operation Object. Relative
   * `operationRef` values MAY be used to locate an existing Operation Object
   * in the OpenAPI Description.
   */
  operationRef?: string;
  /**
   * The name of an existing, resolvable OAS operation, as defined with a
   * unique `operationId`. This field is mutually exclusive of the
   * `operationRef` field.
   */
  operationId?: string;
  /**
   * A map representing parameters to pass to an operation as specified with
   * `operationId` or identified via `operationRef`. The key is the parameter
   * name to be used (optionally qualified with the parameter location, e.g.
   * `path.id` for an `id` parameter in the path), whereas the value can be a
   * constant or a runtime expression to be evaluated and passed to the linked
   * operation.
   */
  parameters?: Record<string, unknown>; // oxlint-disable-line anti-slop/no-unsafe-dictionary-type -- the specification allows any value or runtime expression here
  /**
   * A literal value or runtime expression to use as a request body when
   * calling the target operation.
   */
  requestBody?: unknown;
  /**
   * A description of the link. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * A server object to be used by the target operation.
   */
  server?: ServerObject;
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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#header-object}
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
  schema?: SchemaObject | ReferenceObject;
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
 * Adds metadata to a single tag that is used by the Operation Object. It is
 * not mandatory to have a Tag Object per tag defined in the Operation Object
 * instances.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#tag-object}
 */
export interface TagObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the tag.
   */
  name: string;
  /**
   * A description for the tag. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * Additional external documentation for this tag.
   */
  externalDocs?: ExternalDocumentationObject;
}

/**
 * A simple object to allow referencing other components in the OpenAPI
 * Description, internally and externally.
 *
 * This object cannot be extended with additional properties, and any
 * properties added SHALL be ignored.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#reference-object}
 */
export interface ReferenceObject {
  /**
   * REQUIRED. The reference string.
   */
  $ref: string;
}

/**
 * The data type of a schema. Note that OpenAPI 3.0 does not support `"null"`
 * as a type, nor type arrays; see the Schema Object's `nullable` field.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#data-types}
 */
export type SchemaObjectType =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string";

/**
 * The Schema Object allows the definition of input and output data types.
 * These types can be objects, but also primitives and arrays. This object is
 * an extended subset of the JSON Schema Specification Draft Wright-00.
 *
 * Unless stated otherwise in a field's description, the field definitions
 * follow those of JSON Schema and do not add any additional semantics.
 * Additional JSON Schema keywords not defined here are strictly unsupported.
 *
 * @template T The type of the data instances this schema describes, applied
 * to the `enum`, `default`, and `example` fields. Defaults to `unknown`;
 * subschema positions (`properties`, `items`, ...) are not parameterized.
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#schema-object}
 */
export interface SchemaObject<T = unknown> extends SpecificationExtensions {
  /**
   * A short title for the schema.
   */
  title?: string;
  /**
   * A numeric instance is valid only if division by this keyword's value
   * results in an integer. MUST be a number strictly greater than 0.
   */
  multipleOf?: number;
  /**
   * An inclusive upper limit for a numeric instance, unless
   * `exclusiveMaximum` is `true`.
   */
  maximum?: number;
  /**
   * A boolean indicating whether `maximum` is an exclusive limit. Note that
   * unlike OpenAPI 3.1 and modern JSON Schema, this is a boolean, not a
   * number.
   *
   * @default false
   */
  exclusiveMaximum?: boolean;
  /**
   * An inclusive lower limit for a numeric instance, unless
   * `exclusiveMinimum` is `true`.
   */
  minimum?: number;
  /**
   * A boolean indicating whether `minimum` is an exclusive limit. Note that
   * unlike OpenAPI 3.1 and modern JSON Schema, this is a boolean, not a
   * number.
   *
   * @default false
   */
  exclusiveMinimum?: boolean;
  /**
   * The maximum length of a string instance. MUST be a non-negative integer.
   */
  maxLength?: number;
  /**
   * The minimum length of a string instance. MUST be a non-negative integer.
   *
   * @default 0
   */
  minLength?: number;
  /**
   * This string SHOULD be a valid regular expression, according to the
   * Ecma-262 Edition 5.1 regular expression dialect. Applies only to strings.
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
   * be unique and the array MUST have at least one element.
   */
  required?: string[];
  /**
   * The instance is valid only if its value equals one of the elements in
   * this array.
   */
  enum?: T[];
  /**
   * The data type of the schema. The value MUST be a string; multiple types
   * via an array are not supported. See `nullable` for the alternative to a
   * `"null"` type. Note that keywords and formats do not implicitly require
   * the expected type; use `type` to constrain it.
   */
  type?: SchemaObjectType;
  /**
   * An instance is valid against this keyword if it is valid against all
   * schemas in this array. The inline or referenced schema MUST be of a
   * Schema Object and not a standard JSON Schema.
   */
  allOf?: (SchemaObject | ReferenceObject)[];
  /**
   * An instance is valid against this keyword if it is valid against exactly
   * one schema in this array. The inline or referenced schema MUST be of a
   * Schema Object and not a standard JSON Schema.
   */
  oneOf?: (SchemaObject | ReferenceObject)[];
  /**
   * An instance is valid against this keyword if it is valid against at least
   * one schema in this array. The inline or referenced schema MUST be of a
   * Schema Object and not a standard JSON Schema.
   */
  anyOf?: (SchemaObject | ReferenceObject)[];
  /**
   * An instance is valid against this keyword if it is not valid against the
   * given schema. The inline or referenced schema MUST be of a Schema Object
   * and not a standard JSON Schema.
   */
  not?: SchemaObject | ReferenceObject;
  /**
   * Describes the items of an array instance. The value MUST be an object and
   * not an array. The inline or referenced schema MUST be of a Schema Object
   * and not a standard JSON Schema. `items` MUST be present if `type` is
   * `"array"`.
   */
  items?: SchemaObject | ReferenceObject;
  /**
   * Describes the properties of an object instance. Property definitions MUST
   * be a Schema Object and not a standard JSON Schema (inline or referenced).
   */
  properties?: Record<string, SchemaObject | ReferenceObject>;
  /**
   * Describes properties of an object instance not covered by `properties`.
   * The value can be a boolean or an object. The inline or referenced schema
   * MUST be of a Schema Object and not a standard JSON Schema.
   *
   * @default true
   */
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
  /**
   * A description of the schema. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * The format of the data type. While relying on JSON Schema's defined
   * formats, the OAS offers a few additional predefined formats: `"int32"`,
   * `"int64"`, `"float"`, `"double"` (with `type: "number"`); `"byte"`
   * (base64-encoded), `"binary"` (any sequence of octets), `"date"` (RFC3339
   * full-date), `"date-time"` (RFC3339 date-time), and `"password"` (a hint
   * to obscure the value) (with `type: "string"`). `format` is a
   * non-validating annotation by default; tools that do not recognize a
   * format MAY default back to `type` alone.
   */
  format?: string;
  /**
   * The default value represents what would be assumed by the consumer of the
   * input as the value of the schema if one is not provided. Unlike JSON
   * Schema, the value MUST conform to the defined `type` for the Schema
   * Object defined at the same level (e.g. if `type` is `"string"`, then
   * `default` can be `"foo"` but cannot be `1`).
   */
  default?: T;
  /**
   * This keyword only takes effect if `type` is explicitly defined within the
   * same Schema Object. A `true` value indicates that both `null` values and
   * values of the type specified by `type` are allowed. Other Schema Object
   * constraints retain their defined behavior, and therefore may disallow the
   * use of `null` as a value. A `false` value leaves the specified or default
   * `type` unmodified.
   *
   * @default false
   */
  nullable?: boolean;
  /**
   * Adds support for polymorphism. The discriminator is used to determine
   * which of a set of schemas a payload is expected to satisfy. The
   * discriminator property MUST be a required field of the schema. Legal only
   * when using one of the composite keywords `oneOf`, `anyOf`, `allOf`.
   */
  discriminator?: DiscriminatorObject;
  /**
   * Relevant only for Schema Object `properties` definitions. Declares the
   * property as "read only": it MAY be sent as part of a response but SHOULD
   * NOT be sent as part of the request. If the property is marked `readOnly`
   * and is in the `required` list, `required` takes effect on the response
   * only. A property MUST NOT be marked as both `readOnly` and `writeOnly`
   * being `true`.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * Relevant only for Schema Object `properties` definitions. Declares the
   * property as "write only": it MAY be sent as part of a request but SHOULD
   * NOT be sent as part of the response. If the property is marked
   * `writeOnly` and is in the `required` list, `required` takes effect on the
   * request only. A property MUST NOT be marked as both `readOnly` and
   * `writeOnly` being `true`.
   *
   * @default false
   */
  writeOnly?: boolean;
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
   */
  example?: T;
  /**
   * Specifies that a schema is deprecated and SHOULD be transitioned out of
   * usage.
   *
   * @default false
   */
  deprecated?: boolean;
}

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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#discriminator-object}
 */
export interface DiscriminatorObject {
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
 * A metadata object that allows for more fine-tuned XML model definitions.
 *
 * When using arrays, XML element names are not inferred (for singular/plural
 * forms) and the `name` field SHOULD be used to add that information.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#xml-object}
 */
export interface XMLObject extends SpecificationExtensions {
  /**
   * Replaces the name of the element/attribute used for the described schema
   * property. When defined within `items`, it will affect the name of the
   * individual XML elements within the list. When defined alongside `type`
   * being `"array"` (outside the `items`), it will affect the wrapping
   * element if and only if `wrapped` is `true`; if `wrapped` is `false`, it
   * will be ignored.
   */
  name?: string;
  /**
   * The URI of the namespace definition. Value MUST be in the form of a
   * non-relative URI.
   */
  namespace?: string;
  /**
   * The prefix to be used for the name.
   */
  prefix?: string;
  /**
   * Declares whether the property definition translates to an attribute
   * instead of an element.
   *
   * @default false
   */
  attribute?: boolean;
  /**
   * MAY be used only for an array definition. Signifies whether the array is
   * wrapped (e.g. `<books><book/><book/></books>`) or unwrapped
   * (`<book/><book/>`). The definition takes effect only when defined
   * alongside `type` being `"array"` (outside the `items`).
   *
   * @default false
   */
  wrapped?: boolean;
}

/**
 * The type of a security scheme.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect";

/**
 * Defines an API key security scheme that can be used by the operations. The
 * API key can be sent via a header, cookie, or query parameter.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export interface ApiKeySecuritySchemeObject extends SpecificationExtensions {
  /**
   * REQUIRED. The type of the security scheme.
   */
  type: "apiKey";
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
  /**
   * REQUIRED. The name of the header, query or cookie parameter to be used.
   */
  name: string;
  /**
   * REQUIRED. The location of the API key. Valid values are `"query"`,
   * `"header"`, or `"cookie"`.
   */
  in: "cookie" | "header" | "query";
}

/**
 * Defines an HTTP authentication security scheme that can be used by the
 * operations.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export interface HttpSecuritySchemeObject extends SpecificationExtensions {
  /**
   * REQUIRED. The type of the security scheme.
   */
  type: "http";
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
  /**
   * REQUIRED. The name of the HTTP Authentication scheme to be used in the
   * Authorization header as defined in RFC7235. The values used SHOULD be
   * registered in the IANA Authentication Scheme registry. The value is
   * case-insensitive.
   */
  scheme: string;
  /**
   * A hint to the client to identify how the bearer token is formatted.
   * Bearer tokens are usually generated by an authorization server, so this
   * information is primarily for documentation purposes. Applies to `http`
   * schemes with a `"bearer"` scheme value.
   */
  bearerFormat?: string;
}

/**
 * Defines an OAuth2 security scheme that can be used by the operations, using
 * OAuth2's common flows (implicit, password, client credentials, and
 * authorization code) as defined in RFC6749.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export interface OAuth2SecuritySchemeObject extends SpecificationExtensions {
  /**
   * REQUIRED. The type of the security scheme.
   */
  type: "oauth2";
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
  /**
   * REQUIRED. An object containing configuration information for the flow
   * types supported.
   */
  flows: OAuthFlowsObject;
}

/**
 * Defines an OpenID Connect security scheme that can be used by the
 * operations.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export interface OpenIdConnectSecuritySchemeObject extends SpecificationExtensions {
  /**
   * REQUIRED. The type of the security scheme.
   */
  type: "openIdConnect";
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich
   * text representation.
   */
  description?: string;
  /**
   * REQUIRED. Well-known URL to discover the OpenID Connect Discovery
   * provider metadata.
   */
  openIdConnectUrl: string;
}

/**
 * Defines a security scheme that can be used by the operations. Supported
 * schemes are HTTP authentication, an API key (either as a header, a cookie
 * parameter, or as a query parameter), OAuth2's common flows (implicit,
 * password, client credentials, and authorization code) as defined in
 * RFC6749, and OpenID Connect Discovery.
 *
 * The implicit flow is subject to deprecation by the OAuth 2.0 Security Best
 * Current Practice; the Authorization Code Grant flow with PKCE is
 * recommended for most use cases.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-scheme-object}
 */
export type SecuritySchemeObject =
  | ApiKeySecuritySchemeObject
  | HttpSecuritySchemeObject
  | OAuth2SecuritySchemeObject
  | OpenIdConnectSecuritySchemeObject;

/**
 * Allows configuration of the supported OAuth Flows.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flows-object}
 */
export interface OAuthFlowsObject extends SpecificationExtensions {
  /**
   * Configuration for the OAuth Implicit flow.
   */
  implicit?: ImplicitOAuthFlowObject;
  /**
   * Configuration for the OAuth Resource Owner Password flow.
   */
  password?: PasswordOAuthFlowObject;
  /**
   * Configuration for the OAuth Client Credentials flow. Previously called
   * `application` in OpenAPI 2.0.
   */
  clientCredentials?: ClientCredentialsOAuthFlowObject;
  /**
   * Configuration for the OAuth Authorization Code flow. Previously called
   * `accessCode` in OpenAPI 2.0.
   */
  authorizationCode?: AuthorizationCodeOAuthFlowObject;
}

/**
 * Configuration details common to all supported OAuth Flows.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export interface OAuthFlowObjectBase extends SpecificationExtensions {
  /**
   * The URL to be used for obtaining refresh tokens. This MUST be in the form
   * of a URL. The OAuth2 standard requires the use of TLS.
   */
  refreshUrl?: string;
  /**
   * REQUIRED. The available scopes for the OAuth2 security scheme. A map
   * between the scope name and a short description for it. The map MAY be
   * empty.
   */
  scopes: Record<string, string>;
}

/**
 * Configuration details for the OAuth Implicit flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export interface ImplicitOAuthFlowObject extends OAuthFlowObjectBase {
  /**
   * REQUIRED. The authorization URL to be used for this flow. This MUST be in
   * the form of a URL. The OAuth2 standard requires the use of TLS.
   */
  authorizationUrl: string;
}

/**
 * Configuration details for the OAuth Resource Owner Password flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export interface PasswordOAuthFlowObject extends OAuthFlowObjectBase {
  /**
   * REQUIRED. The token URL to be used for this flow. This MUST be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  tokenUrl: string;
}

/**
 * Configuration details for the OAuth Client Credentials flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export interface ClientCredentialsOAuthFlowObject extends OAuthFlowObjectBase {
  /**
   * REQUIRED. The token URL to be used for this flow. This MUST be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  tokenUrl: string;
}

/**
 * Configuration details for the OAuth Authorization Code flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export interface AuthorizationCodeOAuthFlowObject extends OAuthFlowObjectBase {
  /**
   * REQUIRED. The authorization URL to be used for this flow. This MUST be in
   * the form of a URL. The OAuth2 standard requires the use of TLS.
   */
  authorizationUrl: string;
  /**
   * REQUIRED. The token URL to be used for this flow. This MUST be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  tokenUrl: string;
}

/**
 * Configuration details for a supported OAuth Flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#oauth-flow-object}
 */
export type OAuthFlowObject =
  | AuthorizationCodeOAuthFlowObject
  | ClientCredentialsOAuthFlowObject
  | ImplicitOAuthFlowObject
  | PasswordOAuthFlowObject;

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
 * @see {@link https://spec.openapis.org/oas/v3.0.4.html#security-requirement-object}
 */
export interface SecurityRequirementObject {
  /**
   * Each name MUST correspond to a security scheme which is declared in the
   * Security Schemes under the Components Object. If the security scheme is
   * of type `"oauth2"` or `"openIdConnect"`, then the value is a list of
   * scope names required for the execution, and the list MAY be empty if
   * authorization does not require a specified scope. For other security
   * scheme types, the array MUST be empty.
   */
  [name: string]: string[];
}
