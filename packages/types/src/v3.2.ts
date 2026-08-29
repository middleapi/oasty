/**
 * TypeScript types for the OpenAPI Specification v3.2, authored against
 * release 3.2.0.
 *
 * Types that are structurally identical to OpenAPI 3.1 (including everything
 * they reference) are re-exported from `./v3.1`; every other type is
 * redefined here. Highlights of 3.2: the `$self` document URI, tag hierarchy
 * (`parent`/`kind`), the QUERY HTTP method and `additionalOperations`, the
 * `querystring` parameter location, streaming media types (`itemSchema`,
 * `itemEncoding`, `prefixEncoding`), reusable media types in components, the
 * OAuth2 Device Authorization flow, and the XML `nodeType` model.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html}
 */

import type {
  AuthorizationCodeOAuthFlowObject,
  ClientCredentialsOAuthFlowObject,
  ExternalDocumentationObject,
  ImplicitOAuthFlowObject,
  InfoObject,
  OAuthFlowObjectBase,
  PasswordOAuthFlowObject,
  QueryParameterStyle,
  ReferenceObject,
  SchemaObjectType,
  ServerVariableObject,
  SpecificationExtensions,
} from "./v3.1";

export type {
  AuthorizationCodeOAuthFlowObject,
  ClientCredentialsOAuthFlowObject,
  ContactObject,
  ExternalDocumentationObject,
  ImplicitOAuthFlowObject,
  InfoObject,
  LicenseObject,
  OAuthFlowObjectBase,
  PasswordOAuthFlowObject,
  QueryParameterStyle,
  ReferenceObject,
  SchemaObjectType,
  SecuritySchemeType,
  ServerVariableObject,
  SpecificationExtensions,
} from "./v3.1";

/**
 * This is the root object of the OpenAPI Description.
 *
 * In addition to the required fields, at least one of `components`, `paths`,
 * or `webhooks` MUST be present.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#openapi-object}
 */
export interface OpenAPIObject extends SpecificationExtensions {
  /**
   * REQUIRED. This string MUST be the version number of the OpenAPI
   * Specification that the OpenAPI document uses. The `openapi` field SHOULD
   * be used by tooling to interpret the OpenAPI document. This is not related
   * to the API `info.version` string.
   */
  openapi: `3.2.${string}`;
  /**
   * This string MUST be in the form of a URI reference as defined by RFC3986.
   * Provides the self-assigned URI of this document, which also serves as its
   * base URI. To ensure interoperability, references between documents MUST
   * use the target document's `$self` URI when this field is present. If
   * relative, it is resolved against the next possible base URI source (e.g.
   * the retrieval URI).
   */
  $self?: string;
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
   * array, the default value is an array consisting of a single Server Object
   * with a `url` value of `/`.
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
 * An object representing a Server.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#server-object}
 */
export interface ServerObject extends SpecificationExtensions {
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables
   * and MAY be relative, to indicate that the host location is relative to
   * the location where the document containing the Server Object is being
   * served. Query and fragment MUST NOT be part of this URL. Variable
   * substitutions will be made when a variable is named in `{braces}`. Each
   * server variable MUST NOT appear more than once in the URL template.
   */
  url: string;
  /**
   * An optional string describing the host designated by the URL. CommonMark
   * syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * An optional unique string to refer to the host designated by the URL.
   */
  name?: string;
  /**
   * A map between a variable name and its value. The value is used for
   * substitution in the server's URL template.
   */
  variables?: Record<string, ServerVariableObject>;
}

/**
 * Holds a set of reusable objects for different aspects of the OAS. All
 * objects defined within the Components Object will have no effect on the API
 * unless they are explicitly referenced from outside the Components Object.
 *
 * All the fixed fields are objects whose keys MUST match the regular
 * expression `^[a-zA-Z0-9\.\-_]+$`.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#components-object}
 */
export interface ComponentsObject extends SpecificationExtensions {
  /**
   * An object to hold reusable Schema Objects. Note that the values are not
   * unioned with the Reference Object: `$ref` is a JSON Schema keyword of the
   * Schema Object itself.
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
   * An object to hold reusable Media Type Objects.
   */
  mediaTypes?: Record<string, MediaTypeObject | ReferenceObject>;
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#paths-object}
 */
export interface PathsObject extends SpecificationExtensions {
  /**
   * A relative path to an individual endpoint. The field name MUST begin with
   * a forward slash (`/`). The URL from the Server Object's `url` field,
   * resolved and with template variables substituted, has the path appended
   * (no relative URL resolution) to construct the full URL. Path templating
   * is allowed. When matching URLs, concrete (non-templated) paths would be
   * matched before their templated counterparts. Templated paths with the
   * same hierarchy but different templated names MUST NOT exist as they are
   * identical. In case of ambiguous matching, it is up to the tooling to
   * decide which one to use. Each template expression MUST NOT appear more
   * than once in a single path template.
   */
  [path: `/${string}`]: PathItemObject;
}

/**
 * Describes the operations available on a single path. A Path Item MAY be
 * empty, due to ACL constraints. The path itself is still exposed to the
 * documentation viewer but they will not know which operations and parameters
 * are available.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#path-item-object}
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
   * A definition of a QUERY operation, as defined in the most recent IETF
   * draft of draft-ietf-httpbis-safe-method-w-body, or its RFC successor, on
   * this path.
   */
  query?: OperationObject;
  /**
   * A map of additional operations on this path. The map key is the HTTP
   * method with the same capitalization that is to be sent in the request.
   * This map MUST NOT contain any entry for the methods that can be defined
   * by the other fixed fields with Operation Object values (e.g. no `POST`
   * entry, as the `post` field is used for that method).
   */
  additionalOperations?: Record<string, OperationObject>;
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#operation-object}
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
   * fully supported in HTTP methods where the HTTP 1.1 specification RFC9110
   * has explicitly defined semantics for request bodies. In other cases where
   * the HTTP spec discourages message content (such as GET and DELETE),
   * `requestBody` is permitted but does not have well-defined semantics and
   * SHOULD be avoided if possible.
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
 * The location of a parameter. OpenAPI 3.2 adds `"querystring"`, which treats
 * the entire URL query string as a single parameter value.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#parameter-locations}
 */
export type ParameterLocation =
  | "cookie"
  | "header"
  | "path"
  | "query"
  | "querystring";

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
 *   using form parameters; the representation of array or object properties
 *   is not defined, and `explode` has no effect (`query`).
 * - `"cookie"` — cookie syntax as defined by RFC6265, analogous to `form`
 *   but with name-value pairs separated by `; ` and without percent-encoding
 *   or other escaping applied (`cookie`); new in OpenAPI 3.2.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#style-values}
 */
export type ParameterStyle =
  | "cookie"
  | "deepObject"
  | "form"
  | "label"
  | "matrix"
  | "pipeDelimited"
  | "simple"
  | "spaceDelimited";

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * Parameter Objects MUST include either a `content` field or a `schema`
 * field, but not both. The `style`, `explode`, `allowReserved`, and `schema`
 * fields form the schema group and MUST NOT be used with
 * `in: "querystring"`, which MUST be specified using `content`.
 *
 * An `in: "querystring"` parameter MUST NOT appear more than once, and MUST
 * NOT appear in the same operation (or the operation's path item) as any
 * `in: "query"` parameter, and vice versa.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#parameter-object}
 */
export interface ParameterObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the parameter. Parameter names are case sensitive.
   *
   * - If `in` is `"path"`, the `name` field MUST correspond to a single
   *   template expression occurring within the path field in the Paths
   *   Object.
   * - If `in` is `"header"` and the `name` field is `"Accept"`,
   *   `"Content-Type"` or `"Authorization"`, the parameter definition SHALL
   *   be ignored.
   * - If `in` is `"querystring"`, or for certain combinations of `style` and
   *   `explode`, the value of `name` is not used in the parameter
   *   serialization.
   * - For all other cases, the `name` corresponds to the parameter name used
   *   by the `in` field.
   */
  name: string;
  /**
   * REQUIRED. The location of the parameter. Possible values are `"query"`,
   * `"querystring"`, `"header"`, `"path"` or `"cookie"`.
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
   * Interactions between this field and the parameter's Schema Object are
   * implementation-defined. This field is valid only for `query` parameters.
   *
   * @default false
   * @deprecated Use of this field is NOT RECOMMENDED, and it is likely to be
   * removed in a later revision.
   */
  allowEmptyValue?: boolean;
  /**
   * Describes how the parameter value will be serialized depending on the
   * type of the parameter value. Default values (based on value of `in`): for
   * `"query"` - `"form"`; for `"path"` - `"simple"`; for `"header"` -
   * `"simple"`; for `"cookie"` - `"form"` (for compatibility; `"cookie"`
   * SHOULD be used). This field MUST NOT be used with `in: "querystring"`.
   */
  style?: ParameterStyle;
  /**
   * When true, parameter values of type `array` or `object` generate separate
   * parameters for each value of the array or key-value pair of the map. For
   * other types of parameters, or when `style` is `"deepObject"`, this field
   * has no effect. When `style` is `"form"` or `"cookie"`, the default value
   * is `true`; for all other styles, the default value is `false`.
   */
  explode?: boolean;
  /**
   * When true, parameter values are serialized using reserved expansion, as
   * defined by RFC6570, which allows RFC3986's reserved character set, as
   * well as percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters (including `%` outside
   * of percent-encoded triples). Applications are still responsible for
   * percent-encoding reserved characters that are not allowed by the rules of
   * the `in` destination or media type, or are not allowed in the path by
   * this specification. This field only applies to `in` and `style` values
   * that automatically percent-encode.
   *
   * @default false
   */
  allowReserved?: boolean;
  /**
   * The schema defining the type used for the parameter. This field MUST NOT
   * be used with `in: "querystring"`.
   */
  schema?: SchemaObject;
  /**
   * Example of the parameter's potential value. The `example` field is
   * mutually exclusive of the `examples` field.
   */
  example?: unknown;
  /**
   * Examples of the parameter's potential value. Each example SHOULD contain
   * a value in the correct format as specified in the parameter encoding. The
   * `examples` field is mutually exclusive of the `example` field.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map containing the representations for the parameter. The key is the
   * media type and the value describes it. The map MUST only contain one
   * entry. An `in: "querystring"` parameter is most often defined with the
   * `application/x-www-form-urlencoded` media type.
   */
  content?: Record<string, MediaTypeObject | ReferenceObject>;
}

/**
 * Describes a single request body.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#request-body-object}
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
  content: Record<string, MediaTypeObject | ReferenceObject>;
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
 * Sequential media types (e.g. `application/jsonl`, `application/x-ndjson`,
 * `application/json-seq`, `text/event-stream`, `multipart/mixed`) MUST be
 * mapped to the JSON Schema data model as if their values were in an array in
 * the same order.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#media-type-object}
 */
export interface MediaTypeObject extends SpecificationExtensions {
  /**
   * A description of the media type. Absent from the 3.2.0 Fixed Fields
   * table, but defined by the official OAS 3.2 JSON Schema
   * (`$defs/media-type`).
   *
   * @see {@link https://spec.openapis.org/oas/3.2/schema/2025-09-17}
   * @see {@link https://github.com/OAI/OpenAPI-Specification/pull/4728}
   */
  description?: string;
  /**
   * A schema describing the complete content of the request, response,
   * parameter, or header.
   */
  schema?: SchemaObject;
  /**
   * A schema describing each item within a sequential media type. Unlike
   * `schema`, which would be applied to the complete content treated as an
   * array, `itemSchema` MUST be applied to each item in the stream
   * independently, which supports processing each item as it is read from the
   * stream. Both `schema` and `itemSchema` MAY be used in the same Media Type
   * Object.
   */
  itemSchema?: SchemaObject;
  /**
   * Example of the media type. The example SHOULD match the specified schema
   * and be in the correct format as specified by the media type and its
   * encoding. The `example` field is mutually exclusive of the `examples`
   * field.
   */
  example?: unknown;
  /**
   * Examples of the media type. Each example SHOULD match the specified
   * schema and be in the correct format as specified by the media type and
   * its encoding. The `examples` field is mutually exclusive of the `example`
   * field.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map between a property name and its encoding information, as defined
   * under Encoding By Name. The key, being the property name, MUST exist in
   * the schema as a property (entries with no corresponding schema property
   * SHALL be ignored). The `encoding` field SHALL only apply when the media
   * type is `multipart` or `application/x-www-form-urlencoded`. This field
   * MUST NOT be present if `prefixEncoding` or `itemEncoding` are present.
   */
  encoding?: Record<string, EncodingObject>;
  /**
   * An array of positional encoding information, as defined under Encoding By
   * Position (analogous to `prefixItems`): each Encoding Object applies to
   * the value at the same position in the data array. The `prefixEncoding`
   * field SHALL only apply when the media type is `multipart`. This field
   * MUST NOT be present if `encoding` is present.
   */
  prefixEncoding?: EncodingObject[];
  /**
   * A single Encoding Object that provides encoding information for multiple
   * array items, as defined under Encoding By Position (analogous to
   * `items`): it applies to all items not covered by `prefixEncoding`, and
   * can also be used with `itemSchema` to support streaming multipart
   * content. The `itemEncoding` field SHALL only apply when the media type is
   * `multipart`. This field MUST NOT be present if `encoding` is present.
   */
  itemEncoding?: EncodingObject;
}

/**
 * A single encoding definition applied to a single value.
 *
 * Encoding By Name (the Media Type Object's `encoding` field) correlates
 * properties with `multipart` parts via the `name` parameter of
 * `Content-Disposition: form-data`, and with `application/x-www-form-urlencoded`
 * via query string parameter names; array properties are handled by applying
 * the Encoding Object per array item. Encoding By Position (`prefixEncoding`
 * / `itemEncoding`) correlates Encoding Objects positionally with the items
 * of a `multipart` array. Implementations MUST support one level of nested
 * encoding and MAY support more.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#encoding-object}
 */
export interface EncodingObject extends SpecificationExtensions {
  /**
   * The `Content-Type` for encoding a specific value. The value is a
   * comma-separated list, each element of which is either a specific media
   * type (e.g. `image/png`) or a wildcard media type (e.g. `image/*`).
   * Default value depends on the type of the schema the Encoding Object
   * applies to: for a schema with absent `type` – `application/octet-stream`;
   * for `string` with `contentEncoding` present – `application/octet-stream`;
   * for `string` without `contentEncoding`, and for `number`, `integer`, or
   * `boolean` – `text/plain`; for `object` – `application/json`; for `array`
   * – `application/json` (note that in Encoding By Name the Encoding Object
   * is applied per array item, so this row only applies to array values
   * nested inside a top-level array).
   */
  contentType?: string;
  /**
   * A map allowing additional information to be provided as headers.
   * `Content-Type` is described separately and SHALL be ignored in this
   * section. This field SHALL be ignored if the media type is not a
   * `multipart`.
   */
  headers?: Record<string, HeaderObject | ReferenceObject>;
  /**
   * Applies nested Encoding Objects in the same manner as the Media Type
   * Object's `encoding` field.
   */
  encoding?: Record<string, EncodingObject>;
  /**
   * Applies nested Encoding Objects in the same manner as the Media Type
   * Object's `prefixEncoding` field.
   */
  prefixEncoding?: EncodingObject[];
  /**
   * Applies nested Encoding Objects in the same manner as the Media Type
   * Object's `itemEncoding` field.
   */
  itemEncoding?: EncodingObject;
  /**
   * Describes how a specific value will be serialized depending on its type.
   * See Parameter Object for details on the `style` field. The behavior
   * follows the same values as `query` parameters, including default values,
   * noting that the default of `"form"` applies only when `contentType` is
   * not being used due to `explode` or `allowReserved` being explicitly
   * specified. The initial `?` used in query strings MUST NOT appear in
   * `application/x-www-form-urlencoded` message bodies. This field SHALL be
   * ignored if the media type is not `application/x-www-form-urlencoded` or
   * `multipart/form-data`. If a value is explicitly defined, then the value
   * of `contentType` (implicit or explicit) SHALL be ignored.
   */
  style?: QueryParameterStyle;
  /**
   * When true, values of type `array` or `object` generate separate
   * parameters for each value of the array, or key-value-pair of the map. For
   * other types of values, or when `style` is `"deepObject"`, this field has
   * no effect. When `style` is `"form"`, the default value is `true`; for all
   * other styles, the default value is `false`. This field SHALL be ignored
   * if the media type is not `application/x-www-form-urlencoded` or
   * `multipart/form-data`. If a value is explicitly defined, then the value
   * of `contentType` (implicit or explicit) SHALL be ignored.
   */
  explode?: boolean;
  /**
   * When true, values are serialized using reserved expansion, as defined by
   * RFC6570, which allows RFC3986's reserved character set, as well as
   * percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters (including `%` outside
   * of percent-encoded triples). Applications are still responsible for
   * percent-encoding reserved characters that are not allowed in the target
   * media type. This field SHALL be ignored if the media type is not
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#responses-object}
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
   * for compatibility between JSON and YAML. Status codes SHOULD be selected
   * from the IANA Status Code Registry. To define a range of response codes,
   * this field MAY contain the uppercase wildcard character `X`. For example,
   * `2XX` represents all response codes between `200` and `299`. Only the
   * following range definitions are allowed: `1XX`, `2XX`, `3XX`, `4XX`, and
   * `5XX`. If a response is defined using an explicit code, the explicit code
   * definition takes precedence over the range definition for that code.
   */
  [statusCode: `${1 | 2 | 3 | 4 | 5}${string}`]:
    | ResponseObject
    | ReferenceObject;
}

/**
 * Describes a single response from an API operation, including design-time,
 * static `links` to operations based on the response.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#response-object}
 */
export interface ResponseObject extends SpecificationExtensions {
  /**
   * A short summary of the meaning of the response.
   */
  summary?: string;
  /**
   * A description of the response. CommonMark syntax MAY be used for rich
   * text representation. Note that unlike earlier versions, this field is no
   * longer REQUIRED.
   */
  description?: string;
  /**
   * Maps a header name to its definition. RFC9110 states header names are
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
  content?: Record<string, MediaTypeObject | ReferenceObject>;
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#callback-object}
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
 * An object grouping examples with basic `summary` and `description`
 * metadata, supporting both the data form (`dataValue`) and the serialized
 * form (`serializedValue` / `externalValue`) of the example.
 *
 * Mutual exclusivity: `value` MUST be absent if `dataValue`,
 * `serializedValue`, or `externalValue` is present, and `serializedValue` and
 * `externalValue` are mutually exclusive; `dataValue` MAY be combined with
 * either `serializedValue` or `externalValue`.
 *
 * In all cases, the example value SHOULD be compatible with the schema of its
 * associated value; tooling MAY validate compatibility and reject
 * incompatible examples.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#example-object}
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
   * An example of the data structure that MUST be valid according to the
   * relevant Schema Object. If this field is present, `value` MUST be absent.
   */
  dataValue?: unknown;
  /**
   * An example of the serialized form of the value, including encoding and
   * escaping. If `dataValue` is present, this field SHOULD contain the
   * serialization of the given data. This field SHOULD NOT be used if the
   * serialization format is JSON, as the data form is easier to work with. If
   * this field is present, `value` and `externalValue` MUST be absent.
   */
  serializedValue?: string;
  /**
   * A URI that identifies the serialized example in a separate document,
   * which allows for values not easily or readably expressed as a Unicode
   * string. If `dataValue` is present, this field SHOULD identify a
   * serialization of the given data. If this field is present,
   * `serializedValue` and `value` MUST be absent.
   */
  externalValue?: string;
  /**
   * Embedded literal example. The `value` field and `externalValue` field are
   * mutually exclusive. To represent examples of media types that cannot
   * naturally be represented in JSON or YAML, use a string value to contain
   * the example, escaping where necessary.
   *
   * @deprecated For non-JSON serialization targets, use `dataValue` and/or
   * `serializedValue`, which have unambiguous syntax and semantics, instead.
   */
  value?: unknown;
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#link-object}
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
 * `allowEmptyValue` MUST NOT be used, and `style`, if used, MUST be limited
 * to `"simple"`.
 *
 * When serializing with `schema`, URI percent-encoding MUST NOT be applied
 * and header values MUST be passed through unchanged (no automatic quoting).
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#header-object}
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
   * Example of the header's potential value. The `example` field is mutually
   * exclusive of the `examples` field.
   */
  example?: unknown;
  /**
   * Examples of the header's potential value. Each example SHOULD contain a
   * value in the correct format as specified in the header encoding. The
   * `examples` field is mutually exclusive of the `example` field.
   */
  examples?: Record<string, ExampleObject | ReferenceObject>;
  /**
   * A map containing the representations for the header. The key is the media
   * type and the value describes it. The map MUST only contain one entry.
   */
  content?: Record<string, MediaTypeObject | ReferenceObject>;
}

/**
 * Adds metadata to a single tag that is used by the Operation Object. It is
 * not mandatory to have a Tag Object per tag defined in the Operation Object
 * instances.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#tag-object}
 */
export interface TagObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the tag. Use this value in the `tags` array of an
   * Operation.
   */
  name: string;
  /**
   * A short summary of the tag, used for display purposes.
   */
  summary?: string;
  /**
   * A description for the tag. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description?: string;
  /**
   * Additional external documentation for this tag.
   */
  externalDocs?: ExternalDocumentationObject;
  /**
   * The `name` of a tag that this tag is nested under. The named tag MUST
   * exist in the API description, and circular references between parent and
   * child tags MUST NOT be used.
   */
  parent?: string;
  /**
   * A machine-readable string to categorize what sort of tag it is. Any
   * string value can be used; common uses are `nav` for Navigation, `badge`
   * for visible badges, and `audience` for APIs used by different groups. A
   * registry of the most commonly used values is available.
   */
  kind?: string;
}

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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#schema-object}
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
   * keywords are allowed and are evaluated normally. When inspecting schemas
   * for serialization purposes (e.g. XML or sequential media types),
   * implementations MUST follow `$ref` and `allOf`.
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
   * entry point. Implementations SHOULD support these keywords.
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
   * `discriminator`, polymorphism. When inspecting schemas for serialization
   * purposes, implementations MUST follow `$ref` and `allOf`.
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
   * array instance (tuple validation). Also used to control XML node ordering
   * and to correlate with `prefixEncoding` for positional multipart encoding.
   */
  prefixItems?: SchemaObject[];
  /**
   * A subschema applied to all array items not covered by `prefixItems`.
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
   * `"null"` is a first-class type value. Note that keywords and formats do
   * not implicitly require the expected type; use `type` to constrain it.
   * Schema Objects that do not contain `type` MUST be considered to allow all
   * types during schema inspection: raw binary content omits `type`, while
   * encoded binary uses `type: "string"` with `contentEncoding`.
   */
  type?: SchemaObjectType | SchemaObjectType[];
  /**
   * The instance is valid only if its value equals one of the elements in
   * this array. `enum` cannot carry per-value annotations; implementations
   * MAY recognize a `oneOf`/`anyOf` whose subschemas each consist of `const`
   * plus annotations (e.g. `title`, `description`) as an annotated
   * enumeration.
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
   * An exclusive upper limit for a numeric instance.
   */
  exclusiveMaximum?: number;
  /**
   * An inclusive lower limit for a numeric instance.
   */
  minimum?: number;
  /**
   * An exclusive lower limit for a numeric instance.
   */
  exclusiveMinimum?: number;
  /**
   * The maximum length of a string instance. MUST be a non-negative integer.
   * MAY be used to set an expected upper bound on the length of a streaming
   * payload of string data or unencoded binary data (where the length is the
   * number of octets); for that use it MAY be implemented outside of regular
   * JSON Schema evaluation.
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
   * documenting the receiver's behavior; it is not inserted into the data
   * (contrast with the Server Variable Object's `default`).
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
   * a response but SHOULD NOT be sent in a request. Per JSON Schema
   * Validation Draft 2020-12 §9.4, the owning authority MAY either ignore a
   * `readOnly` field sent in a request or treat it as an error.
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
   * The encoding (`base64`, `base64url`, or another encoding) used to
   * represent binary data as a string instance. Unrelated to the HTTP
   * `Content-Encoding` header. For multipart content, using `contentEncoding`
   * is equivalent to requiring a `Content-Transfer-Encoding` header. Treated
   * as an annotation rather than validated directly.
   */
  contentEncoding?: string;
  /**
   * The media type of the content of a string instance (or of raw binary
   * data). Redundant if the media type is already set as the Media Type
   * Object's key or in an Encoding Object's `contentType`, and SHALL be
   * ignored if it contradicts them. Treated as an annotation rather than
   * validated directly.
   */
  contentMediaType?: string;
  /**
   * A subschema describing the structure of the string's decoded content
   * (e.g. JSON in a `text/event-stream` `data` field). Treated as an
   * annotation rather than validated directly.
   */
  contentSchema?: SchemaObject;

  // OAS base vocabulary

  /**
   * Provides a hint about which of a set of schemas a payload is expected to
   * satisfy. Legal only when using one of the composite keywords `oneOf`,
   * `anyOf`, `allOf` — adjacent to `oneOf`/`anyOf`, or in a parent schema
   * that child schemas reference via `allOf`; MUST NOT change the validation
   * outcome. When the discriminating property is optional, the Discriminator
   * Object MUST include a `defaultMapping` field.
   */
  discriminator?: DiscriminatorObject;
  /**
   * Adds additional metadata to describe the XML representation of this
   * schema. Note that unlike earlier versions, OpenAPI 3.2 does not restrict
   * `xml` to property schemas.
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#schema-object}
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#discriminator-object}
 */
export interface DiscriminatorObject extends SpecificationExtensions {
  /**
   * REQUIRED. The name of the property in the payload that will hold the
   * discriminating value. The discriminating property MAY be defined as
   * required or optional, but when defined as optional the Discriminator
   * Object MUST include a `defaultMapping` field.
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
  /**
   * The schema name or URI reference to a schema that is expected to validate
   * the structure of the model when the discriminating property is not
   * present in the payload, or contains a value for which there is no
   * explicit or implicit mapping. REQUIRED when the discriminating property
   * is defined as optional.
   */
  defaultMapping?: string;
}

/**
 * The type of XML node a schema corresponds to (with DOM `nodeType` numeric
 * equivalents):
 *
 * - `"element"` (1) — the schema represents an element and describes its
 *   contents.
 * - `"attribute"` (2) — the schema represents an attribute and its value.
 * - `"text"` (3) — the schema represents a text node (parsed character data).
 * - `"cdata"` (4) — the schema represents a CDATA section.
 * - `"none"` — no corresponding node; nodes from subschemas are included
 *   directly under the parent schema's node.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#xml-node-types}
 */
export type XMLNodeType = "attribute" | "cdata" | "element" | "none" | "text";

/**
 * A metadata object that allows for more fine-tuned XML model definitions.
 *
 * When using arrays, XML element names are not inferred (for singular/plural
 * forms) and the `name` field SHOULD be used to add that information.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#xml-object}
 */
export interface XMLObject extends SpecificationExtensions {
  /**
   * The type of XML node this schema corresponds to. The default value is
   * `"none"` if `$ref`, `$dynamicRef`, or `type: "array"` is present in the
   * Schema Object containing the XML Object, and `"element"` otherwise; set
   * an explicit `nodeType: "element"` on an array schema to produce a
   * wrapping element.
   */
  nodeType?: XMLNodeType;
  /**
   * Sets the name of the element/attribute corresponding to the schema,
   * replacing the inferred name (a component schema's name, or the parent
   * property's name; in other cases, such as inline media-type schemas, no
   * name can be inferred and an XML Object with `name` MUST be present). This
   * field SHALL be ignored if `nodeType` is `"text"`, `"cdata"`, or
   * `"none"`.
   */
  name?: string;
  /**
   * The IRI (RFC3987) of the namespace definition. Value MUST be in the form
   * of a non-relative IRI.
   */
  namespace?: string;
  /**
   * The prefix to be used for the name.
   */
  prefix?: string;
  /**
   * Declares whether the property definition translates to an attribute
   * instead of an element. This field MUST NOT be present if `nodeType` is
   * present.
   *
   * @default false
   * @deprecated Use `nodeType: "attribute"` instead of `attribute: true`.
   */
  attribute?: boolean;
  /**
   * MAY be used only for an array definition. Signifies whether the array is
   * wrapped (e.g. `<books><book/><book/></books>`) or unwrapped
   * (`<book/><book/>`). The definition takes effect only when defined
   * alongside `type` being `"array"` (outside the `items`). This field MUST
   * NOT be present if `nodeType` is present.
   *
   * @default false
   * @deprecated Use `nodeType: "element"` instead of `wrapped: true`.
   */
  wrapped?: boolean;
}

/**
 * Defines an API key security scheme that can be used by the operations. The
 * API key can be sent via a header, cookie, or query parameter.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
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
   * Declares this security scheme to be deprecated. Consumers SHOULD refrain
   * from usage of the declared scheme.
   *
   * @default false
   */
  deprecated?: boolean;
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
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
   * Declares this security scheme to be deprecated. Consumers SHOULD refrain
   * from usage of the declared scheme.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * REQUIRED. The name of the HTTP Authentication scheme to be used in the
   * Authorization header as defined in RFC9110. The values used SHOULD be
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
 * Defines a mutual TLS security scheme (use of a client certificate) that can
 * be used by the operations. There are no additional configuration fields.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
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
  /**
   * Declares this security scheme to be deprecated. Consumers SHOULD refrain
   * from usage of the declared scheme.
   *
   * @default false
   */
  deprecated?: boolean;
}

/**
 * Defines an OAuth2 security scheme that can be used by the operations, using
 * OAuth2's common flows (implicit, password, client credentials, and
 * authorization code) as defined in RFC6749, and the Device Authorization
 * flow as defined in RFC8628.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
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
   * Declares this security scheme to be deprecated. Consumers SHOULD refrain
   * from usage of the declared scheme.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * REQUIRED. An object containing configuration information for the flow
   * types supported.
   */
  flows: OAuthFlowsObject;
  /**
   * URL to the OAuth2 authorization server metadata (RFC8414). TLS is
   * required.
   */
  oauth2MetadataUrl?: string;
}

/**
 * Defines an OpenID Connect security scheme that can be used by the
 * operations.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
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
   * Declares this security scheme to be deprecated. Consumers SHOULD refrain
   * from usage of the declared scheme.
   *
   * @default false
   */
  deprecated?: boolean;
  /**
   * REQUIRED. Well-known URL to discover the OpenID Connect Discovery
   * provider metadata.
   */
  openIdConnectUrl: string;
}

/**
 * Defines a security scheme that can be used by the operations. Supported
 * schemes are HTTP authentication, an API key (either as a header, a cookie
 * parameter, or as a query parameter), mutual TLS (use of a client
 * certificate), OAuth2's common flows (implicit, password, client
 * credentials, and authorization code) as defined in RFC6749, the OAuth2
 * Device Authorization flow as defined in RFC8628, and OpenID Connect
 * Discovery.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-scheme-object}
 */
export type SecuritySchemeObject =
  | ApiKeySecuritySchemeObject
  | HttpSecuritySchemeObject
  | MutualTlsSecuritySchemeObject
  | OAuth2SecuritySchemeObject
  | OpenIdConnectSecuritySchemeObject;

/**
 * Allows configuration of the supported OAuth Flows.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#oauth-flows-object}
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
  /**
   * Configuration for the OAuth Device Authorization flow.
   */
  deviceAuthorization?: DeviceAuthorizationOAuthFlowObject;
}

/**
 * Configuration details for the OAuth Device Authorization flow (RFC8628).
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#oauth-flow-object}
 */
export interface DeviceAuthorizationOAuthFlowObject extends OAuthFlowObjectBase {
  /**
   * REQUIRED. The device authorization URL to be used for this flow. This
   * MUST be in the form of a URL. The OAuth2 standard requires the use of
   * TLS.
   */
  deviceAuthorizationUrl: string;
  /**
   * REQUIRED. The token URL to be used for this flow. This MUST be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  tokenUrl: string;
}

/**
 * Configuration details for a supported OAuth Flow.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#oauth-flow-object}
 */
export type OAuthFlowObject =
  | AuthorizationCodeOAuthFlowObject
  | ClientCredentialsOAuthFlowObject
  | DeviceAuthorizationOAuthFlowObject
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
 * @see {@link https://spec.openapis.org/oas/v3.2.0.html#security-requirement-object}
 */
export interface SecurityRequirementObject {
  /**
   * Each name or URI MUST correspond to a security scheme: either the name of
   * a Security Scheme Object declared in the Components Object's
   * `securitySchemes`, or the URI of a Security Scheme Object. Property names
   * that are identical to a component name MUST be treated as a component
   * name; to reference a scheme with a single-segment relative URI reference
   * that collides with a component name, prefix it with the `./` path segment
   * (e.g. `"./foo"`). If the security scheme is of type `"oauth2"` or
   * `"openIdConnect"`, then the value is a list of scope names required for
   * the execution, and the list MAY be empty if authorization does not
   * require a specified scope. For other security scheme types, the array MAY
   * contain a list of role names which are required for the execution, but
   * are not otherwise defined or exchanged in-band.
   */
  [name: string]: string[];
}
