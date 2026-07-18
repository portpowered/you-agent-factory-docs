/**
 * Minimal OpenAPI document shapes used by the W09 events corpus resolver.
 *
 * Pure type contracts — no filesystem or package resolution. Selection walks
 * path → GET operation → response status → `text/event-stream` → `x-event-schema`.
 */

export const EVENTS_SSE_RESPONSE_STATUS = "200" as const;
export const EVENTS_SSE_MEDIA_TYPE = "text/event-stream" as const;

export type EventsOpenApiMediaTypeObject = {
  schema?: unknown;
  "x-event-schema"?: unknown;
};

export type EventsOpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  responses?: Record<
    string,
    {
      content?: Record<string, EventsOpenApiMediaTypeObject | undefined>;
    }
  >;
};

export type EventsOpenApiPathItem = {
  get?: EventsOpenApiOperation;
};

export type EventsOpenApiDocument = {
  openapi?: string;
  paths?: Record<string, EventsOpenApiPathItem | undefined>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

export type EventsOpenApiComponentsSchemasLike = {
  components?: {
    schemas?: Record<string, unknown>;
  };
};
