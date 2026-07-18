/**
 * Pure helpers that inspect the unmodified packaged OpenAPI for the three
 * SSE operations. Used by tests and investigation evidence — does not mutate
 * the document.
 */

import {
  SSE_SPIKE_OPERATIONS,
  type SseSpikeOperationItem,
  type SseSpikeRole,
} from "./sse-operations";

export type OpenApiLike = {
  paths?: Record<
    string,
    {
      get?: {
        operationId?: string;
        summary?: string;
        description?: string;
        responses?: Record<
          string,
          {
            content?: Record<
              string,
              {
                schema?: unknown;
                "x-event-schema"?: unknown;
              }
            >;
          }
        >;
      };
    }
  >;
};

export type ObservedSseOperation = {
  path: string;
  method: "get";
  operationId: string | undefined;
  role: SseSpikeRole;
  roleLabel: string;
  hasTextEventStream: boolean;
  xEventSchema: unknown;
  summary: string | undefined;
};

function mediaType(
  doc: OpenApiLike,
  path: string,
  status: string,
  type: string,
) {
  return doc.paths?.[path]?.get?.responses?.[status]?.content?.[type];
}

/**
 * Observe each inventory operation against an already-parsed OpenAPI object.
 * Callers must supply the unmodified packaged document (or an identical parse).
 */
export function observeSseOperationsFromOpenApi(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperationItem[] = SSE_SPIKE_OPERATIONS,
): ObservedSseOperation[] {
  return inventory.map((item) => {
    const operation = doc.paths?.[item.path]?.get;
    const stream = mediaType(doc, item.path, "200", "text/event-stream");

    return {
      path: item.path,
      method: item.method,
      operationId: operation?.operationId,
      role: item.role,
      roleLabel: item.roleLabel,
      hasTextEventStream: stream !== undefined,
      xEventSchema: stream?.["x-event-schema"],
      summary: operation?.summary,
    };
  });
}

/**
 * True when every inventory path still exists with `text/event-stream` and
 * `x-event-schema` on the 200 response — evidence the document was not
 * preprocessed to remove SSE contract data.
 */
export function packagedOpenApiRetainsSseOperations(
  doc: OpenApiLike,
  inventory: readonly SseSpikeOperationItem[] = SSE_SPIKE_OPERATIONS,
): boolean {
  const observed = observeSseOperationsFromOpenApi(doc, inventory);
  return observed.every(
    (entry) =>
      entry.hasTextEventStream &&
      typeof entry.xEventSchema === "string" &&
      entry.xEventSchema.length > 0 &&
      entry.operationId ===
        inventory.find((item) => item.path === entry.path)?.operationId,
  );
}
