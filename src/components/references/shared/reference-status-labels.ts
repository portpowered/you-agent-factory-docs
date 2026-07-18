/**
 * Pure label helpers for reference lifecycle and visibility chrome.
 * No React — keep presentation strings deterministic for tests and filters.
 */

import type {
  ReferenceFamily,
  ReferenceLifecycle,
  ReferenceLifecycleState,
} from "@/lib/references/reference-item";
import type { ReferenceVisibility } from "./types";

const FAMILY_LABELS: Record<ReferenceFamily, string> = {
  api: "API",
  schema: "Schema",
  cli: "CLI",
  mcp: "MCP",
  javascript: "JavaScript",
  events: "Events",
};

const LIFECYCLE_STATE_LABELS: Record<ReferenceLifecycleState, string> = {
  active: "Active",
  deprecated: "Deprecated",
  removed: "Removed",
};

const VISIBILITY_LABELS: Record<ReferenceVisibility, string> = {
  public: "Public",
  internal: "Internal",
};

/** Human-readable family label for chrome and filters. */
export function referenceFamilyLabel(family: ReferenceFamily): string {
  return FAMILY_LABELS[family];
}

/** Human-readable lifecycle state label. */
export function referenceLifecycleStateLabel(
  state: ReferenceLifecycleState,
): string {
  return LIFECYCLE_STATE_LABELS[state];
}

/** Human-readable visibility label. */
export function referenceVisibilityLabel(
  visibility: ReferenceVisibility,
): string {
  return VISIBILITY_LABELS[visibility];
}

/**
 * Compact accessible summary for a lifecycle block. Includes optional since /
 * deprecated / removed / successor fields when published — never invents them.
 */
export function referenceLifecycleSummary(
  lifecycle: ReferenceLifecycle,
): string {
  const parts = [referenceLifecycleStateLabel(lifecycle.state)];
  if (lifecycle.since !== undefined) {
    parts.push(`since ${lifecycle.since}`);
  }
  if (lifecycle.deprecated !== undefined) {
    parts.push(`deprecated ${lifecycle.deprecated}`);
  }
  if (lifecycle.removed !== undefined) {
    parts.push(`removed ${lifecycle.removed}`);
  }
  if (lifecycle.successorId !== undefined) {
    parts.push(`successor ${lifecycle.successorId}`);
  }
  return parts.join(", ");
}

/** Format a source pointer for badge display without inventing origin text. */
export function referenceSourceArtifactLabel(source: {
  publicArtifactId: string;
  pointer: string;
  path?: string;
}): string {
  if (source.path !== undefined && source.path.length > 0) {
    return `${source.publicArtifactId} (${source.path})`;
  }
  return `${source.publicArtifactId} @ ${source.pointer}`;
}
