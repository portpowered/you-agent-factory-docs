/**
 * Pure display helpers for W09 stream-operation canonicality chrome.
 *
 * Labels are role-driven text — never color-only meaning. Preferred session
 * stream marking is reserved for the canonical FactoryEvent stream; ephemeral
 * observation is never presented as canonical replay state; compatibility-only
 * is never preferred.
 */

import type { EventSchemaDisplayTarget } from "@/lib/references/events";
import {
  type EventStreamRole,
  isPreferredEventStreamRole,
  type SelectedEventStream,
} from "@/lib/references/events";

export type EventCanonicalityPresentation = {
  role: EventStreamRole;
  /** Short badge label shown in chrome. */
  badgeLabel: string;
  /**
   * True only for the canonical session FactoryEvent stream — the preferred
   * consumer source. Ephemeral and compatibility-only are never preferred.
   */
  isPreferredSessionStream: boolean;
  /** True for the process-global compatibility-only stream. */
  isCompatibilityOnly: boolean;
  /**
   * True only for the canonical stream. Ephemeral response events must never
   * present as canonical replay state.
   */
  isCanonicalReplayState: boolean;
  /** Accessible description for the role badge. */
  description: string;
};

export type EventStreamOperationSummaryModel = {
  path: string;
  method: "get";
  operationId: string;
  role: EventStreamRole;
  roleLabel: string;
  payloadRoot: "FactoryEvent" | "FactoryResponseEvent";
  canonicality: EventCanonicalityPresentation;
  /** Deeper catalog anchor fragment (no leading `#`) when available. */
  catalogAnchor?: string;
  /** Schema-pointer anchor fragment for the payload root when available. */
  schemaPointerAnchor?: string;
};

const CANONICALITY_BY_ROLE: Record<
  EventStreamRole,
  Omit<EventCanonicalityPresentation, "role" | "isPreferredSessionStream">
> = {
  canonical: {
    badgeLabel: "Canonical",
    isCompatibilityOnly: false,
    isCanonicalReplayState: true,
    description:
      "Preferred session-scoped FactoryEvent stream. Use this stream for canonical replay and catch-up.",
  },
  ephemeral: {
    badgeLabel: "Ephemeral",
    isCompatibilityOnly: false,
    isCanonicalReplayState: false,
    description:
      "Ephemeral FactoryResponseEvent observation stream. Not canonical replay state.",
  },
  "compatibility-only": {
    badgeLabel: "Compatibility-only",
    isCompatibilityOnly: true,
    isCanonicalReplayState: false,
    description:
      "Compatibility-only process-global FactoryEvent stream. Non-canonical and never preferred for new consumers.",
  },
};

/**
 * Build accessible canonicality presentation for a stream role.
 */
export function eventCanonicalityPresentationForRole(
  role: EventStreamRole,
): EventCanonicalityPresentation {
  const base = CANONICALITY_BY_ROLE[role];
  return {
    role,
    ...base,
    isPreferredSessionStream: isPreferredEventStreamRole(role),
  };
}

/**
 * Preferred / non-preferred label for badges. Only the canonical session
 * stream is preferred; ephemeral and compatibility-only are never preferred.
 */
export function eventPreferredSessionStreamLabel(
  presentation: EventCanonicalityPresentation,
): string {
  return presentation.isPreferredSessionStream ? "Preferred" : "Not preferred";
}

/**
 * Build a stream-operation summary model from a selected OpenAPI stream and
 * optional W04 schema display target (for catalog deep links).
 */
export function eventStreamOperationSummaryModelFromSelected(
  stream: SelectedEventStream,
  target?: EventSchemaDisplayTarget,
): EventStreamOperationSummaryModel {
  const payloadRoot =
    stream.payloadRootSchemaName === "FactoryResponseEvent"
      ? "FactoryResponseEvent"
      : "FactoryEvent";

  return {
    path: stream.path,
    method: stream.method,
    operationId: stream.operationId,
    role: stream.role,
    roleLabel: stream.roleLabel,
    payloadRoot,
    canonicality: eventCanonicalityPresentationForRole(stream.role),
    ...(target?.eventAnchor !== undefined
      ? { catalogAnchor: target.eventAnchor }
      : {}),
    ...(target?.schemaPointerAnchor !== undefined
      ? { schemaPointerAnchor: target.schemaPointerAnchor }
      : {}),
  };
}

/**
 * Map selected streams + optional schema targets into summary models in
 * inventory order (canonical → ephemeral → compatibility-only).
 */
export function eventStreamOperationSummaryModelsFromCorpus(input: {
  selectedStreams: readonly SelectedEventStream[];
  schemaTargets?: readonly EventSchemaDisplayTarget[];
}): EventStreamOperationSummaryModel[] {
  const targetsByOperationId = new Map(
    (input.schemaTargets ?? []).map((target) => [target.operationId, target]),
  );

  return input.selectedStreams.map((stream) =>
    eventStreamOperationSummaryModelFromSelected(
      stream,
      targetsByOperationId.get(stream.operationId),
    ),
  );
}
