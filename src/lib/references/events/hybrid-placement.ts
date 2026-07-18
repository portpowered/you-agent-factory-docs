/**
 * Locked hybrid placement for the production events corpus (W09).
 *
 * W02's placement decision gate selected hybrid; this module records that
 * outcome as production ownership policy. Do not reopen integrated vs separate
 * vs hybrid debates in this lane — consume the locked contract below.
 */

export const LOCKED_EVENT_STREAM_PLACEMENT = "hybrid" as const;

export type LockedEventStreamPlacement = typeof LOCKED_EVENT_STREAM_PLACEMENT;

/**
 * Hybrid ownership split recorded by W02 and owned by W09 / W08.
 */
export const HYBRID_EVENT_STREAM_OWNERSHIP = {
  placement: LOCKED_EVENT_STREAM_PLACEMENT,
  /**
   * Events corpus (`/docs/references/events`, this W09 surface) owns the full
   * envelope + discriminator payload catalog, navigation, and search documents.
   */
  eventsCorpusOwns: [
    "factory-event-envelope",
    "factory-event-discriminator-payload-catalog",
    "factory-response-event-envelope",
    "factory-response-event-dimensions",
    "event-family-navigation",
    "event-search-documents",
    "client-facing-reconnect-lifecycle-docs",
    "static-sse-examples",
  ] as const,
  /**
   * API operation page (W08) retains HTTP transport semantics and only
   * summarizes streams with links into events anchors.
   */
  apiOperationPageOwns: [
    "reconnect",
    "cursor-precedence",
    "handshake-response-headers",
    "dual-accept",
    "replay-retained-history",
    "compatibility-only-status",
  ] as const,
  eventTruthOwner: "openapi" as const,
  asyncApiRole: "generated-projection-only" as const,
  statement:
    "Hybrid placement is locked: the events corpus owns envelope/payload catalog, navigation, and client-facing reconnect/lifecycle docs; the API operation page retains HTTP transport/reconnect/cursor/handshake/dual-Accept/replay ownership and only summarizes with links into events anchors.",
} as const;

/**
 * True when the supplied placement matches the locked W02 hybrid outcome.
 * Use this guard instead of re-evaluating placement options.
 */
export function isLockedHybridPlacement(
  placement: string,
): placement is LockedEventStreamPlacement {
  return placement === LOCKED_EVENT_STREAM_PLACEMENT;
}

/**
 * Assert the locked hybrid contract for production callers. Throws when a
 * caller attempts to reopen a non-hybrid placement.
 */
export function assertLockedHybridPlacement(
  placement: string = LOCKED_EVENT_STREAM_PLACEMENT,
): LockedEventStreamPlacement {
  if (!isLockedHybridPlacement(placement)) {
    throw new Error(
      `Event-stream placement is locked to hybrid (W02 decision gate). Received "${placement}". Do not reopen integrated vs separate vs hybrid in W09.`,
    );
  }
  return placement;
}
