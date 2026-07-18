/**
 * Fail-closed Factory-reference chrome message resolution (W17).
 *
 * Mirrors explorer-labels: missing or empty required chrome keys throw instead
 * of silently falling back to English on shipped non-default locales.
 */

import type {
  ReferenceChromeMessages,
  UiMessages,
} from "@/lib/content/ui-messages.types";

export class ReferenceChromeLabelsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceChromeLabelsError";
  }
}

function assertNonEmptyLabel(
  path: string,
  value: unknown,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ReferenceChromeLabelsError(
      `Reference chrome label "${path}" is missing or empty; localized reference chrome fails closed without English fallback.`,
    );
  }
}

function assertStringRecord(
  path: string,
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, string> {
  if (!value || typeof value !== "object") {
    throw new ReferenceChromeLabelsError(
      `Reference chrome "${path}" is missing; localized reference chrome fails closed without English fallback.`,
    );
  }
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    assertNonEmptyLabel(`${path}.${key}`, record[key]);
  }
}

const FILTER_KEYS = [
  "queryPlaceholder",
  "lifecycleLabel",
  "visibilityLabel",
  "allLifecycles",
  "allVisibility",
  "clearFilters",
  "showingOf",
  "schemaQueryPlaceholder",
  "schemaQueryLabel",
  "schemaNoMatchesTitle",
  "schemaNoMatchesMessage",
  "clear",
] as const;

const STATUS_KEYS = [
  "loadingTitle",
  "loadingMessage",
  "emptyTitle",
  "emptyMessage",
  "invalidTitle",
  "invalidMessage",
  "unsupportedTitle",
  "unsupportedMessage",
] as const;

const BADGE_KEYS = [
  "family",
  "package",
  "packageVersion",
  "sourceArtifact",
  "sourceCommit",
  "lifecycle",
  "visibility",
  "contractSource",
  "packageVersionNotPublished",
  "notPublishedOnProjection",
  "familyWithLabel",
] as const;

const FAMILY_KEYS = [
  "api",
  "schema",
  "cli",
  "mcp",
  "javascript",
  "events",
] as const;

const LIFECYCLE_STATE_KEYS = ["active", "deprecated", "removed"] as const;

const LIFECYCLE_SUMMARY_KEYS = [
  "since",
  "deprecated",
  "removed",
  "successor",
] as const;

const VISIBILITY_STATE_KEYS = ["public", "internal"] as const;

const A11Y_KEYS = ["copyAnchorLink", "anchorLinkCopied"] as const;

const EXAMPLE_KEYS = ["authored", "generated", "exampleIndexed"] as const;

const INVENTORY_FAMILY_KEYS = [
  "filterLegend",
  "queryLabel",
  "queryPlaceholder",
  "emptyTitle",
  "emptyDescription",
  "errorTitle",
  "errorDescription",
  "filterEmpty",
  "countOne",
  "countMany",
] as const;

const INVENTORY_KEYS = ["cli", "mcp", "javascript"] as const;

/**
 * Fail closed when reference chrome catalogs are incomplete.
 * Callers must not silently fall back to English constants for unfilled locales.
 */
export function assertReferenceChromeMessages(
  chrome: unknown,
): asserts chrome is ReferenceChromeMessages {
  if (!chrome || typeof chrome !== "object") {
    throw new ReferenceChromeLabelsError(
      "Reference chrome messages are missing; localized reference chrome fails closed without English fallback.",
    );
  }

  const record = chrome as Record<string, unknown>;
  assertStringRecord("referenceChrome.filter", record.filter, FILTER_KEYS);
  assertStringRecord("referenceChrome.status", record.status, STATUS_KEYS);
  assertStringRecord("referenceChrome.badge", record.badge, BADGE_KEYS);
  assertStringRecord("referenceChrome.families", record.families, FAMILY_KEYS);
  assertStringRecord(
    "referenceChrome.lifecycleStates",
    record.lifecycleStates,
    LIFECYCLE_STATE_KEYS,
  );
  assertStringRecord(
    "referenceChrome.lifecycleSummary",
    record.lifecycleSummary,
    LIFECYCLE_SUMMARY_KEYS,
  );
  assertStringRecord(
    "referenceChrome.visibilityStates",
    record.visibilityStates,
    VISIBILITY_STATE_KEYS,
  );
  assertStringRecord("referenceChrome.a11y", record.a11y, A11Y_KEYS);
  assertStringRecord("referenceChrome.examples", record.examples, EXAMPLE_KEYS);

  const inventory = record.inventory;
  if (!inventory || typeof inventory !== "object") {
    throw new ReferenceChromeLabelsError(
      "Reference chrome inventory messages are missing; localized reference chrome fails closed without English fallback.",
    );
  }
  const inventoryRecord = inventory as Record<string, unknown>;
  for (const family of INVENTORY_KEYS) {
    assertStringRecord(
      `referenceChrome.inventory.${family}`,
      inventoryRecord[family],
      INVENTORY_FAMILY_KEYS,
    );
  }
}

export function resolveReferenceChromeMessages(
  messages: UiMessages,
): ReferenceChromeMessages {
  assertReferenceChromeMessages(messages.referenceChrome);
  return messages.referenceChrome;
}

/** Interpolate `{name}` placeholders in chrome templates. */
export function formatReferenceChromeTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
}
