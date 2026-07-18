/**
 * Pure label helpers for reference lifecycle and visibility chrome.
 * No React — keep presentation strings deterministic for tests and filters.
 *
 * Prefer passing localized {@link ReferenceChromeMessages}; English defaults
 * match the shipped `en` catalog for isolated unit tests only.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import { formatReferenceChromeTemplate } from "@/lib/i18n/reference-chrome-labels";
import type {
  ReferenceFamily,
  ReferenceLifecycle,
  ReferenceLifecycleState,
} from "@/lib/references/reference-item";
import type { ReferenceVisibility } from "./types";

/** English chrome labels matching `src/content/messages/en/common.json`. */
export const ENGLISH_REFERENCE_STATUS_LABELS = {
  families: {
    api: "API",
    schema: "Schema",
    cli: "CLI",
    mcp: "MCP",
    javascript: "JavaScript",
    events: "Events",
  },
  lifecycleStates: {
    active: "Active",
    deprecated: "Deprecated",
    removed: "Removed",
  },
  visibilityStates: {
    public: "Public",
    internal: "Internal",
  },
  lifecycleSummary: {
    since: "since {value}",
    deprecated: "deprecated {value}",
    removed: "removed {value}",
    successor: "successor {value}",
  },
} as const;

function familiesFromChrome(
  chrome: ReferenceChromeMessages | undefined,
): ReferenceChromeMessages["families"] {
  return chrome?.families ?? ENGLISH_REFERENCE_STATUS_LABELS.families;
}

function lifecycleStatesFromChrome(
  chrome: ReferenceChromeMessages | undefined,
): ReferenceChromeMessages["lifecycleStates"] {
  return (
    chrome?.lifecycleStates ?? ENGLISH_REFERENCE_STATUS_LABELS.lifecycleStates
  );
}

function visibilityStatesFromChrome(
  chrome: ReferenceChromeMessages | undefined,
): ReferenceChromeMessages["visibilityStates"] {
  return (
    chrome?.visibilityStates ?? ENGLISH_REFERENCE_STATUS_LABELS.visibilityStates
  );
}

function lifecycleSummaryFromChrome(
  chrome: ReferenceChromeMessages | undefined,
): ReferenceChromeMessages["lifecycleSummary"] {
  return (
    chrome?.lifecycleSummary ?? ENGLISH_REFERENCE_STATUS_LABELS.lifecycleSummary
  );
}

/** Human-readable family label for chrome and filters. */
export function referenceFamilyLabel(
  family: ReferenceFamily,
  chrome?: ReferenceChromeMessages,
): string {
  return familiesFromChrome(chrome)[family];
}

/** Human-readable lifecycle state label. */
export function referenceLifecycleStateLabel(
  state: ReferenceLifecycleState,
  chrome?: ReferenceChromeMessages,
): string {
  return lifecycleStatesFromChrome(chrome)[state];
}

/** Human-readable visibility label. */
export function referenceVisibilityLabel(
  visibility: ReferenceVisibility,
  chrome?: ReferenceChromeMessages,
): string {
  return visibilityStatesFromChrome(chrome)[visibility];
}

/**
 * Compact accessible summary for a lifecycle block. Includes optional since /
 * deprecated / removed / successor fields when published — never invents them.
 */
export function referenceLifecycleSummary(
  lifecycle: ReferenceLifecycle,
  chrome?: ReferenceChromeMessages,
): string {
  const summary = lifecycleSummaryFromChrome(chrome);
  const parts = [referenceLifecycleStateLabel(lifecycle.state, chrome)];
  if (lifecycle.since !== undefined) {
    parts.push(
      formatReferenceChromeTemplate(summary.since, { value: lifecycle.since }),
    );
  }
  if (lifecycle.deprecated !== undefined) {
    parts.push(
      formatReferenceChromeTemplate(summary.deprecated, {
        value: lifecycle.deprecated,
      }),
    );
  }
  if (lifecycle.removed !== undefined) {
    parts.push(
      formatReferenceChromeTemplate(summary.removed, {
        value: lifecycle.removed,
      }),
    );
  }
  if (lifecycle.successorId !== undefined) {
    parts.push(
      formatReferenceChromeTemplate(summary.successor, {
        value: lifecycle.successorId,
      }),
    );
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
