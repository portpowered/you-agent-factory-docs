/**
 * Pure projectors for OpenAPI operation request/response detail on the W08
 * production API surface.
 *
 * Shallow-resolves `#/components/parameters/*` refs for display. Never invents
 * example payloads — only authored `example` / `examples` values from the
 * package document are projected. Does not walk full schema field trees (W07).
 */

import {
  OPENAPI_HTTP_METHODS,
  type OpenApiHttpMethod,
} from "@/lib/references/family-normalized-models";
import { resolveApiOperationAnchor } from "./operation-anchors";

const HTTP_METHOD_SET = new Set<string>(OPENAPI_HTTP_METHODS);

/** Format unknown example values for CodePanel / clipboard (no IO). */
function formatExampleValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Marker attribute for the operation detail section host (same as anchors). */
export const API_OPERATION_DETAIL_ATTR = "data-api-operation-detail" as const;

/** Marker for a request/response media-type row. */
export const API_MEDIA_TYPE_ATTR = "data-api-media-type" as const;

/** Marker for the parameters list region. */
export const API_PARAMETERS_ATTR = "data-api-operation-parameters" as const;

/** Marker for the request-body region. */
export const API_REQUEST_BODY_ATTR = "data-api-operation-request-body" as const;

/** Marker for the responses region. */
export const API_RESPONSES_ATTR = "data-api-operation-responses" as const;

export const API_PARAMETER_LOCATIONS = [
  "path",
  "query",
  "header",
  "cookie",
] as const;

export type ApiParameterLocation = (typeof API_PARAMETER_LOCATIONS)[number];

/** Coarse media-type kind for accessible labeling (not color-only meaning). */
export const API_MEDIA_TYPE_KINDS = ["json", "event-stream", "other"] as const;

export type ApiMediaTypeKind = (typeof API_MEDIA_TYPE_KINDS)[number];

export type ApiOperationExample = {
  /** Stable list key (authored example name or index label). */
  id: string;
  /** Formatted code for CodePanel / clipboard. */
  code: string;
  /** Optional short label from OpenAPI example summary/name. */
  label?: string;
  language: string;
};

export type ApiMediaContentDetail = {
  mediaType: string;
  kind: ApiMediaTypeKind;
  /** Schema `$ref` target when published (display name only). */
  schemaRef?: string;
  /** Compact type summary when an inline schema publishes `type`. */
  typeSummary?: string;
  /** Authored examples only — empty when the document omits them. */
  examples: readonly ApiOperationExample[];
};

export type ApiOperationParameterDetail = {
  name: string;
  location: ApiParameterLocation;
  required: boolean;
  description?: string;
  typeSummary?: string;
  schemaRef?: string;
};

export type ApiOperationRequestBodyDetail = {
  required: boolean;
  description?: string;
  mediaTypes: readonly ApiMediaContentDetail[];
};

export type ApiOperationResponseDetail = {
  statusCode: string;
  description?: string;
  mediaTypes: readonly ApiMediaContentDetail[];
};

export type ApiOperationDetail = {
  method: OpenApiHttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  /** Stable fragment without `#` (prefer operationId). */
  anchor: string;
  parameters: readonly ApiOperationParameterDetail[];
  requestBody?: ApiOperationRequestBodyDetail;
  responses: readonly ApiOperationResponseDetail[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isHttpMethod(value: string): value is OpenApiHttpMethod {
  return HTTP_METHOD_SET.has(value);
}

function isParameterLocation(value: string): value is ApiParameterLocation {
  return (API_PARAMETER_LOCATIONS as readonly string[]).includes(value);
}

/**
 * Classify a media type string for distinguishable labels (JSON vs SSE vs other).
 */
export function classifyApiMediaType(mediaType: string): ApiMediaTypeKind {
  const normalized = mediaType.trim().toLowerCase();
  if (normalized === "text/event-stream") {
    return "event-stream";
  }
  if (
    normalized === "application/json" ||
    normalized.endsWith("+json") ||
    normalized.includes("json")
  ) {
    return "json";
  }
  return "other";
}

/**
 * Accessible human label for a media-type kind (text carries meaning).
 */
export function apiMediaTypeKindLabel(kind: ApiMediaTypeKind): string {
  switch (kind) {
    case "json":
      return "JSON";
    case "event-stream":
      return "Server-Sent Events";
    default:
      return "Other";
  }
}

/**
 * Language hint for CodePanel from a media type.
 */
export function apiMediaTypeLanguage(mediaType: string): string {
  const kind = classifyApiMediaType(mediaType);
  if (kind === "json") return "json";
  if (kind === "event-stream") return "text";
  const normalized = mediaType.trim().toLowerCase();
  if (normalized.includes("yaml")) return "yaml";
  if (normalized.includes("xml")) return "xml";
  return "text";
}

function schemaRefName(ref: string): string | undefined {
  const match = ref.match(/#\/components\/schemas\/([^/]+)$/);
  return match?.[1];
}

function readSchemaSummary(
  schema: unknown,
): Pick<ApiMediaContentDetail, "schemaRef" | "typeSummary"> {
  if (!isPlainObject(schema)) {
    return {};
  }
  const ref = optionalNonEmptyString(schema.$ref);
  if (ref !== undefined) {
    return {
      schemaRef: ref,
      typeSummary: schemaRefName(ref) ?? ref,
    };
  }
  const type = optionalNonEmptyString(schema.type);
  if (type !== undefined) {
    return { typeSummary: type };
  }
  return {};
}

function projectAuthoredExamples(
  media: Record<string, unknown>,
  mediaType: string,
): ApiOperationExample[] {
  const language = apiMediaTypeLanguage(mediaType);
  const examples: ApiOperationExample[] = [];

  if (media.example !== undefined && media.example !== null) {
    examples.push({
      id: "example",
      code: formatExampleValue(media.example),
      label: "Example",
      language,
    });
  }

  const named = media.examples;
  if (isPlainObject(named)) {
    for (const [name, entry] of Object.entries(named)) {
      if (!isPlainObject(entry)) continue;
      if (entry.value === undefined) continue;
      const summary = optionalNonEmptyString(entry.summary);
      examples.push({
        id: name,
        code: formatExampleValue(entry.value),
        label: summary ?? name,
        language,
      });
    }
  }

  return examples;
}

function projectMediaContent(content: unknown): ApiMediaContentDetail[] {
  if (!isPlainObject(content)) {
    return [];
  }

  const mediaTypes: ApiMediaContentDetail[] = [];
  for (const [mediaType, mediaValue] of Object.entries(content)) {
    if (!isPlainObject(mediaValue)) continue;
    const kind = classifyApiMediaType(mediaType);
    const schemaBits = readSchemaSummary(mediaValue.schema);
    const detail: ApiMediaContentDetail = {
      mediaType,
      kind,
      examples: projectAuthoredExamples(mediaValue, mediaType),
    };
    if (schemaBits.schemaRef !== undefined) {
      detail.schemaRef = schemaBits.schemaRef;
    }
    if (schemaBits.typeSummary !== undefined) {
      detail.typeSummary = schemaBits.typeSummary;
    }
    mediaTypes.push(detail);
  }
  return mediaTypes;
}

function resolveComponentParameter(
  document: Record<string, unknown>,
  ref: string,
): Record<string, unknown> | undefined {
  const match = ref.match(/^#\/components\/parameters\/([^/]+)$/);
  if (match === null) return undefined;
  const parameterName = match[1];
  if (parameterName === undefined || parameterName.length === 0) {
    return undefined;
  }
  const components = document.components;
  if (!isPlainObject(components)) return undefined;
  const parameters = components.parameters;
  if (!isPlainObject(parameters)) return undefined;
  const target = parameters[parameterName];
  return isPlainObject(target) ? target : undefined;
}

/**
 * Resolve a parameter object, following one level of component `$ref`.
 */
export function resolveOpenApiParameter(
  document: unknown,
  parameter: unknown,
): ApiOperationParameterDetail | undefined {
  if (!isPlainObject(document) || !isPlainObject(parameter)) {
    return undefined;
  }

  let current: Record<string, unknown> = parameter;
  const ref = optionalNonEmptyString(parameter.$ref);
  if (ref !== undefined) {
    const resolved = resolveComponentParameter(document, ref);
    if (resolved === undefined) {
      return undefined;
    }
    current = resolved;
  }

  const name = optionalNonEmptyString(current.name);
  const locationRaw = optionalNonEmptyString(current.in);
  if (name === undefined || locationRaw === undefined) {
    return undefined;
  }
  if (!isParameterLocation(locationRaw)) {
    return undefined;
  }

  const detail: ApiOperationParameterDetail = {
    name,
    location: locationRaw,
    required: current.required === true,
  };
  const description = optionalNonEmptyString(current.description);
  if (description !== undefined) {
    detail.description = description;
  }
  const schemaBits = readSchemaSummary(current.schema);
  if (schemaBits.schemaRef !== undefined) {
    detail.schemaRef = schemaBits.schemaRef;
  }
  if (schemaBits.typeSummary !== undefined) {
    detail.typeSummary = schemaBits.typeSummary;
  }
  return detail;
}

function projectParameters(
  document: Record<string, unknown>,
  operation: Record<string, unknown>,
  pathItem: Record<string, unknown>,
): ApiOperationParameterDetail[] {
  const combined: unknown[] = [];
  if (Array.isArray(pathItem.parameters)) {
    combined.push(...pathItem.parameters);
  }
  if (Array.isArray(operation.parameters)) {
    combined.push(...operation.parameters);
  }

  const seen = new Set<string>();
  const details: ApiOperationParameterDetail[] = [];
  for (const entry of combined) {
    const detail = resolveOpenApiParameter(document, entry);
    if (detail === undefined) continue;
    const key = `${detail.location}:${detail.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    details.push(detail);
  }
  return details;
}

function projectRequestBody(
  operation: Record<string, unknown>,
): ApiOperationRequestBodyDetail | undefined {
  const body = operation.requestBody;
  if (!isPlainObject(body)) {
    return undefined;
  }
  // Skip unresolved requestBody $ref wrappers without local content.
  if (body.$ref !== undefined && body.content === undefined) {
    return undefined;
  }
  const mediaTypes = projectMediaContent(body.content);
  if (mediaTypes.length === 0 && body.content === undefined) {
    return undefined;
  }
  const detail: ApiOperationRequestBodyDetail = {
    required: body.required === true,
    mediaTypes,
  };
  const description = optionalNonEmptyString(body.description);
  if (description !== undefined) {
    detail.description = description;
  }
  return detail;
}

function projectResponses(
  operation: Record<string, unknown>,
): ApiOperationResponseDetail[] {
  const responses = operation.responses;
  if (!isPlainObject(responses)) {
    return [];
  }

  const details: ApiOperationResponseDetail[] = [];
  for (const [statusCode, responseValue] of Object.entries(responses)) {
    if (!isPlainObject(responseValue)) continue;
    const detail: ApiOperationResponseDetail = {
      statusCode,
      mediaTypes: projectMediaContent(responseValue.content),
    };
    const description = optionalNonEmptyString(responseValue.description);
    if (description !== undefined) {
      detail.description = description;
    }
    details.push(detail);
  }
  return details;
}

/**
 * Project one OpenAPI path+method operation into display detail.
 * Returns undefined when the method/path is not a published HTTP operation.
 */
export function projectApiOperationDetail(
  document: unknown,
  path: string,
  method: string,
): ApiOperationDetail | undefined {
  if (!isPlainObject(document)) {
    return undefined;
  }
  const methodKey = method.toLowerCase();
  if (!isHttpMethod(methodKey)) {
    return undefined;
  }

  const paths = document.paths;
  if (!isPlainObject(paths)) {
    return undefined;
  }
  const pathItem = paths[path];
  if (!isPlainObject(pathItem)) {
    return undefined;
  }
  const operation = pathItem[methodKey];
  if (!isPlainObject(operation)) {
    return undefined;
  }

  const operationId = optionalNonEmptyString(operation.operationId);
  const summary = optionalNonEmptyString(operation.summary);
  const description = optionalNonEmptyString(operation.description);
  const anchor = resolveApiOperationAnchor({
    anchor: operationId ?? `${methodKey}-${path}`,
    operationId,
    method: methodKey,
    path,
  });

  const detail: ApiOperationDetail = {
    method: methodKey,
    path,
    anchor,
    parameters: projectParameters(document, operation, pathItem),
    responses: projectResponses(operation),
  };
  if (operationId !== undefined) {
    detail.operationId = operationId;
  }
  if (summary !== undefined) {
    detail.summary = summary;
  }
  if (description !== undefined) {
    detail.description = description;
  }
  const requestBody = projectRequestBody(operation);
  if (requestBody !== undefined) {
    detail.requestBody = requestBody;
  }
  return detail;
}

/**
 * Project every published HTTP operation from a package OpenAPI document.
 */
export function projectApiOperationDetailsFromDocument(
  document: unknown,
): ApiOperationDetail[] {
  if (!isPlainObject(document)) {
    return [];
  }
  const paths = document.paths;
  if (!isPlainObject(paths)) {
    return [];
  }

  const details: ApiOperationDetail[] = [];
  for (const [path, pathItemValue] of Object.entries(paths)) {
    if (!isPlainObject(pathItemValue)) continue;
    for (const methodKey of Object.keys(pathItemValue)) {
      if (!isHttpMethod(methodKey.toLowerCase())) continue;
      const detail = projectApiOperationDetail(document, path, methodKey);
      if (detail !== undefined) {
        details.push(detail);
      }
    }
  }
  return details;
}

/**
 * Count operations that publish at least one authored media example.
 */
export function countApiOperationsWithAuthoredExamples(
  details: readonly ApiOperationDetail[],
): number {
  return details.filter((detail) => {
    const requestExamples =
      detail.requestBody?.mediaTypes.some((m) => m.examples.length > 0) ??
      false;
    const responseExamples = detail.responses.some((response) =>
      response.mediaTypes.some((m) => m.examples.length > 0),
    );
    return requestExamples || responseExamples;
  }).length;
}

/**
 * Count operations that publish a `text/event-stream` response media type.
 */
export function countApiOperationsWithEventStream(
  details: readonly ApiOperationDetail[],
): number {
  return details.filter((detail) =>
    detail.responses.some((response) =>
      response.mediaTypes.some((m) => m.kind === "event-stream"),
    ),
  ).length;
}
