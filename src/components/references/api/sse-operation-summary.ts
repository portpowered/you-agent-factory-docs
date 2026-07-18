/**
 * Pure projectors for hybrid SSE operation summaries on the API surface.
 *
 * Owns HTTP transport semantics for the three published SSE operations and
 * emits links toward planned `/docs/references/events` anchors (W09). Does not
 * implement the full event envelope/payload catalog UI.
 */

import {
  anchorForIdentity,
  buildUrlSafeAnchor,
} from "@/lib/references/reference-anchor-registry";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import {
  API_SSE_OPERATIONS,
  API_SSE_SUMMARY_SAFETY,
  type ApiSseOperation,
  type ApiSseOperationItem,
  type ApiSseRole,
  findApiSseOperation,
} from "./sse-operations";

export type ApiSseHttpSemanticsField =
  | "transport"
  | "reconnect"
  | "cursorPrecedence"
  | "handshakeHeaders"
  | "dualAccept"
  | "replayRetainedHistory"
  | "compatibilityOnlyStatus";

export type ApiSseHttpSemanticsEntry = {
  field: ApiSseHttpSemanticsField;
  label: string;
  /** Human-readable value; empty string means not applicable for this role. */
  value: string;
  applicable: boolean;
};

export type ApiSseEventsCatalogLink = {
  /** Absolute docs path with fragment (for example `/docs/references/events#…`). */
  href: string;
  /** Fragment without `#`. */
  anchor: string;
  label: string;
};

export type ApiSseOperationSummary = {
  path: string;
  method: "get";
  operationId: string;
  role: ApiSseRole;
  roleLabel: string;
  preferredOrCanonical: boolean;
  /**
   * Explicit presentation rule: compatibility-only must never be labeled
   * preferred or canonical.
   */
  neverPreferredOrCanonical: boolean;
  semantics: readonly ApiSseHttpSemanticsEntry[];
  eventsCatalogLinks: readonly ApiSseEventsCatalogLink[];
  /** Static-only: summaries never open a live SSE connection. */
  opensLiveEventStreamConnection: false;
  /** Full catalog UI is W09 ownership. */
  implementsFullEventCatalog: false;
};

export const API_EVENTS_REFERENCE_PAGE_PATH =
  REFERENCE_FAMILY_PAGE_PATHS.events;

const HANDSHAKE_HEADERS = [
  "X-Factory-Session-Backend-Scope-Id",
  "X-Factory-Session-Logical-Session-Key-Id",
  "X-Factory-Session-Factory-Session-Id",
  "X-Factory-Session-Stream-Generation-Id",
] as const;

type SseSemanticsByRole = Record<
  ApiSseRole,
  {
    transport: string;
    reconnect: string;
    cursorPrecedence: { value: string; applicable: boolean };
    handshakeHeaders: { value: string; applicable: boolean };
    dualAccept: { value: string; applicable: boolean };
    replayRetainedHistory: string;
    compatibilityOnlyStatus: { value: string; applicable: boolean };
  }
>;

/**
 * HTTP semantics owned by the API operation page under hybrid placement.
 * Values mirror packaged OpenAPI prose / W00 baseline — not a second corpus.
 */
const SSE_HTTP_SEMANTICS_BY_ROLE: SseSemanticsByRole = {
  canonical: {
    transport:
      "Server-Sent Events over HTTP (`text/event-stream`). Keep-alive idle waiting is normal; the stream ends only when the HTTP connection closes.",
    reconnect:
      "Clients reconnect with `after_event_id` and/or `after_sequence` query parameters targeting events newer than the last acknowledged point.",
    cursorPrecedence: {
      applicable: true,
      value:
        "When both cursors are present, `after_event_id` wins. For session-scoped streams, `after_sequence` prefers `FactoryEvent.context.sessionSequence` when present, otherwise `FactoryEvent.context.sequence`. Omitting both starts replay from the beginning of retained history.",
    },
    handshakeHeaders: {
      applicable: true,
      value: HANDSHAKE_HEADERS.join(", "),
    },
    dualAccept: {
      applicable: true,
      value:
        "Dual Accept: `text/event-stream` opens SSE; `application/json` returns `FactorySessionEventStreamRecovery` (`STREAM_READY` | `CURSOR_STALE` | `UNKNOWN_SESSION` | `INTERNAL_ERROR`) instead of opening a stream.",
    },
    replayRetainedHistory:
      "Retained history is replayed first in ascending tick order, then live `FactoryEvent` records on the same connection. Live sessions replay only the current stream generation; stale cursors return typed invalid-cursor handling rather than silently skipping events.",
    compatibilityOnlyStatus: {
      applicable: false,
      value: "",
    },
  },
  ephemeral: {
    transport:
      "Server-Sent Events over HTTP (`text/event-stream`). Each SSE `data` record is JSON matching `FactoryResponseEvent`; each SSE `id` is the decimal `FactoryResponseEvent.sequence`.",
    reconnect:
      "Clients reconnect with `after_sequence` (last acknowledged `FactoryResponseEvent.sequence`). Optional filters: `dispatch_id` and repeated `kind`.",
    cursorPrecedence: {
      applicable: true,
      value:
        "Omit `after_sequence` to start at the beginning of retained history. When a cursor predates retained history, the first emitted record is `STREAM_GAP` describing the lost range (no silent skip).",
    },
    handshakeHeaders: {
      applicable: false,
      value: "Identity handshake headers are not published on this route.",
    },
    dualAccept: {
      applicable: false,
      value:
        "SSE only (`text/event-stream`). No JSON reconnect probe / dual-Accept on this route.",
    },
    replayRetainedHistory:
      "Retained matching records replay first in ascending response sequence, then live matching records. Outside canonical `FactoryEvent` replay — must not derive canonical Factory state.",
    compatibilityOnlyStatus: {
      applicable: false,
      value: "",
    },
  },
  "compatibility-only": {
    transport:
      "Server-Sent Events over HTTP (`text/event-stream`). Process-global stream without session identity handshakes.",
    reconnect:
      "Clients may pass `after_event_id` or `after_sequence` for events newer than the acknowledged point.",
    cursorPrecedence: {
      applicable: true,
      value:
        "Shared `after_event_id` / `after_sequence` cursors apply. This route must not govern default-session dashboard recovery.",
    },
    handshakeHeaders: {
      applicable: false,
      value: "No identity handshake headers on this route.",
    },
    dualAccept: {
      applicable: false,
      value: "SSE only (`text/event-stream`). No JSON recovery probe.",
    },
    replayRetainedHistory:
      "Retained history first in ascending tick order, then live events on the same connection.",
    compatibilityOnlyStatus: {
      applicable: true,
      value:
        "Compatibility-only / non-preferred. Never present as preferred or canonical. New Factory Session and durable replay consumers must use the session-scoped canonical stream instead.",
    },
  },
};

const SEMANTICS_FIELD_LABELS: Record<ApiSseHttpSemanticsField, string> = {
  transport: "Transport / media type",
  reconnect: "Reconnect",
  cursorPrecedence: "Cursor precedence",
  handshakeHeaders: "Handshake / response headers",
  dualAccept: "Dual Accept",
  replayRetainedHistory: "Replay / retained history",
  compatibilityOnlyStatus: "Compatibility-only status",
};

function schemaNameFromRef(ref: string): string {
  const parts = ref.replace(/^#\//, "").split("/");
  return parts[parts.length - 1] ?? ref;
}

/**
 * Build a planned W09 events-catalog deep link for an envelope schema ref.
 * Anchors follow W04 schema-pointer encoding even when W09 UI is not shipped.
 */
export function apiSseEventsCatalogLinkForSchemaRef(
  eventSchemaRef: string,
  pagePath: string = API_EVENTS_REFERENCE_PAGE_PATH,
): ApiSseEventsCatalogLink {
  const anchor = anchorForIdentity("schema-pointer", eventSchemaRef);
  const schemaName = schemaNameFromRef(eventSchemaRef);
  return {
    href: `${pagePath}#${anchor}`,
    anchor,
    label: `${schemaName} envelope and payload catalog`,
  };
}

/**
 * Optional stream-role section link on the events page (planned W09 anchor).
 * Distinct from the schema envelope anchor so readers can land on stream docs.
 */
export function apiSseEventsCatalogLinkForStreamRole(
  role: ApiSseRole,
  pagePath: string = API_EVENTS_REFERENCE_PAGE_PATH,
): ApiSseEventsCatalogLink {
  const identity = `sse-stream-${role}`;
  const anchor = buildUrlSafeAnchor(identity);
  const labelByRole: Record<ApiSseRole, string> = {
    canonical: "Canonical FactoryEvent stream catalog",
    ephemeral: "Ephemeral FactoryResponseEvent stream catalog",
    "compatibility-only": "Compatibility-only FactoryEvent stream catalog",
  };
  return {
    href: `${pagePath}#${anchor}`,
    anchor,
    label: labelByRole[role],
  };
}

function projectSemantics(
  role: ApiSseRole,
): readonly ApiSseHttpSemanticsEntry[] {
  const source = SSE_HTTP_SEMANTICS_BY_ROLE[role];
  const entries: ApiSseHttpSemanticsEntry[] = [
    {
      field: "transport",
      label: SEMANTICS_FIELD_LABELS.transport,
      value: source.transport,
      applicable: true,
    },
    {
      field: "reconnect",
      label: SEMANTICS_FIELD_LABELS.reconnect,
      value: source.reconnect,
      applicable: true,
    },
    {
      field: "cursorPrecedence",
      label: SEMANTICS_FIELD_LABELS.cursorPrecedence,
      value: source.cursorPrecedence.value,
      applicable: source.cursorPrecedence.applicable,
    },
    {
      field: "handshakeHeaders",
      label: SEMANTICS_FIELD_LABELS.handshakeHeaders,
      value: source.handshakeHeaders.value,
      applicable: source.handshakeHeaders.applicable,
    },
    {
      field: "dualAccept",
      label: SEMANTICS_FIELD_LABELS.dualAccept,
      value: source.dualAccept.value,
      applicable: source.dualAccept.applicable,
    },
    {
      field: "replayRetainedHistory",
      label: SEMANTICS_FIELD_LABELS.replayRetainedHistory,
      value: source.replayRetainedHistory,
      applicable: true,
    },
    {
      field: "compatibilityOnlyStatus",
      label: SEMANTICS_FIELD_LABELS.compatibilityOnlyStatus,
      value: source.compatibilityOnlyStatus.value,
      applicable: source.compatibilityOnlyStatus.applicable,
    },
  ];
  return entries;
}

/**
 * Project one SSE inventory item into an API-page hybrid summary.
 */
export function projectApiSseOperationSummary(
  operation: ApiSseOperation,
): ApiSseOperationSummary {
  const neverPreferredOrCanonical = operation.role === "compatibility-only";
  if (neverPreferredOrCanonical && operation.preferredOrCanonical) {
    throw new Error(
      `SSE operation ${operation.operationId} is compatibility-only but marked preferredOrCanonical.`,
    );
  }

  return {
    path: operation.path,
    method: operation.method,
    operationId: operation.operationId,
    role: operation.role,
    roleLabel: operation.roleLabel,
    preferredOrCanonical: operation.preferredOrCanonical,
    neverPreferredOrCanonical,
    semantics: projectSemantics(operation.role),
    eventsCatalogLinks: [
      apiSseEventsCatalogLinkForSchemaRef(operation.eventSchemaRef),
      apiSseEventsCatalogLinkForStreamRole(operation.role),
    ],
    opensLiveEventStreamConnection:
      API_SSE_SUMMARY_SAFETY.opensLiveEventStreamConnection,
    implementsFullEventCatalog:
      API_SSE_SUMMARY_SAFETY.implementsFullEventCatalog,
  };
}

/** Project all three published SSE operations into API-page summaries. */
export function projectAllApiSseOperationSummaries(): ApiSseOperationSummary[] {
  return API_SSE_OPERATIONS.map((operation) =>
    projectApiSseOperationSummary(operation),
  );
}

/**
 * Resolve a hybrid SSE summary for an operation section, or `undefined` when
 * the operation is not one of the three published SSE streams.
 */
export function resolveApiSseOperationSummary(options: {
  operationId?: string;
  path?: string;
  method?: string;
}): ApiSseOperationSummary | undefined {
  const operation = findApiSseOperation(options);
  if (!operation) return undefined;
  return projectApiSseOperationSummary(operation);
}

/** Map summaries by operationId for harness / section lookup. */
export function apiSseOperationSummariesByOperationId(): Map<
  string,
  ApiSseOperationSummary
> {
  return new Map(
    projectAllApiSseOperationSummaries().map((summary) => [
      summary.operationId,
      summary,
    ]),
  );
}

/** Assert compatibility-only is never preferred/canonical in the inventory. */
export function assertCompatibilityOnlyNeverPreferred(
  operations: readonly ApiSseOperationItem[] = API_SSE_OPERATIONS,
): boolean {
  return operations.every((operation) => {
    if (operation.role !== "compatibility-only") return true;
    return operation.preferredOrCanonical === false;
  });
}
