/**
 * Minimal OpenAPI document shapes used by the W09 events corpus resolver.
 *
 * Pure type contracts — no filesystem or package resolution. Selection walks
 * path → GET operation → response status → `text/event-stream` → `x-event-schema`.
 * Reconnect/lifecycle builders also read query parameters, response headers,
 * and dual-Accept JSON recovery content from the same document.
 */

export const EVENTS_SSE_RESPONSE_STATUS = "200" as const;
export const EVENTS_SSE_MEDIA_TYPE = "text/event-stream" as const;

export type EventsOpenApiMediaTypeObject = {
  schema?: unknown;
  "x-event-schema"?: unknown;
};

export type EventsOpenApiParameterObject = {
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: { type?: string };
  $ref?: string;
};

export type EventsOpenApiHeaderObject = {
  description?: string;
  schema?: unknown;
};

export type EventsOpenApiResponseObject = {
  description?: string;
  headers?: Record<string, EventsOpenApiHeaderObject | undefined>;
  content?: Record<string, EventsOpenApiMediaTypeObject | undefined>;
};

export type EventsOpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: EventsOpenApiParameterObject[];
  responses?: Record<string, EventsOpenApiResponseObject | undefined>;
};

export type EventsOpenApiPathItem = {
  get?: EventsOpenApiOperation;
};

export type EventsOpenApiDocument = {
  openapi?: string;
  paths?: Record<string, EventsOpenApiPathItem | undefined>;
  components?: {
    schemas?: Record<string, unknown>;
    parameters?: Record<string, EventsOpenApiParameterObject | undefined>;
  };
};

export type EventsOpenApiComponentsSchemasLike = {
  components?: {
    schemas?: Record<string, unknown>;
  };
};
