/**
 * Pure inventory filter helpers for W10 CLI / MCP / JavaScript references.
 *
 * Filtering is ephemeral presentation only — helpers never mutate inputs and
 * never invent missing lifecycle or visibility fields.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type {
  ReferenceLifecycle,
  ReferenceLifecycleState,
} from "@/lib/references/reference-item";
import { REFERENCE_LIFECYCLE_STATES } from "@/lib/references/reference-item";
import { referenceLifecycleStateLabel } from "./reference-status-labels";

/** Sentinel for "no lifecycle facet selected". */
export const REFERENCE_INVENTORY_FILTER_ALL = "all" as const;

export type ReferenceInventoryLifecycleFilter =
  | typeof REFERENCE_INVENTORY_FILTER_ALL
  | ReferenceLifecycleState;

/**
 * Visibility facet uses the published string when present (for example
 * `visible`, `public`, `internal`). `"all"` means no visibility facet.
 */
export type ReferenceInventoryVisibilityFilter =
  | typeof REFERENCE_INVENTORY_FILTER_ALL
  | string;

export type ReferenceInventoryFilterState = {
  /** Case-insensitive substring match against identity / aliases / description. */
  query: string;
  lifecycle: ReferenceInventoryLifecycleFilter;
  visibility: ReferenceInventoryVisibilityFilter;
};

/** Default filter state — show the full inventory. */
export const DEFAULT_REFERENCE_INVENTORY_FILTER: ReferenceInventoryFilterState =
  {
    query: "",
    lifecycle: REFERENCE_INVENTORY_FILTER_ALL,
    visibility: REFERENCE_INVENTORY_FILTER_ALL,
  };

/**
 * Minimal shape an inventory item must expose for filtering. Callers map
 * family-specific projections into this without inventing contract text.
 */
export type ReferenceInventoryFilterableItem = {
  /** Primary identity text (command path, tool name, symbol path, …). */
  identityText: string;
  aliases?: readonly string[];
  description?: string;
  lifecycle?: ReferenceLifecycle;
  /** Published visibility string when present on the projection. */
  visibility?: string;
};

export function createReferenceInventoryFilterState(
  overrides: Partial<ReferenceInventoryFilterState> = {},
): ReferenceInventoryFilterState {
  return {
    ...DEFAULT_REFERENCE_INVENTORY_FILTER,
    ...overrides,
  };
}

export function isReferenceInventoryFilterActive(
  filter: ReferenceInventoryFilterState,
): boolean {
  return (
    filter.query.trim().length > 0 ||
    filter.lifecycle !== REFERENCE_INVENTORY_FILTER_ALL ||
    filter.visibility !== REFERENCE_INVENTORY_FILTER_ALL
  );
}

function normalizeSearchHaystack(
  parts: readonly (string | undefined)[],
): string {
  return parts
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join("\n")
    .toLowerCase();
}

/**
 * Return true when the item matches the ephemeral filter. Items that omit
 * lifecycle/visibility fail closed for those facets (they do not match a
 * specific facet selection) — never invent missing fields to pass a filter.
 */
export function matchesReferenceInventoryFilter(
  item: ReferenceInventoryFilterableItem,
  filter: ReferenceInventoryFilterState,
): boolean {
  const query = filter.query.trim().toLowerCase();
  if (query.length > 0) {
    const haystack = normalizeSearchHaystack([
      item.identityText,
      ...(item.aliases ?? []),
      item.description,
    ]);
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (filter.lifecycle !== REFERENCE_INVENTORY_FILTER_ALL) {
    if (item.lifecycle === undefined) {
      return false;
    }
    if (item.lifecycle.state !== filter.lifecycle) {
      return false;
    }
  }

  if (filter.visibility !== REFERENCE_INVENTORY_FILTER_ALL) {
    if (item.visibility === undefined) {
      return false;
    }
    if (item.visibility !== filter.visibility) {
      return false;
    }
  }

  return true;
}

/**
 * Filter a list without mutating the input. Preserves input order.
 */
export function filterReferenceInventoryItems<
  T extends ReferenceInventoryFilterableItem,
>(items: readonly T[], filter: ReferenceInventoryFilterState): T[] {
  return items.filter((item) => matchesReferenceInventoryFilter(item, filter));
}

/** Lifecycle facet options for select controls (includes "all"). */
export function referenceInventoryLifecycleFilterOptions(
  chrome?: ReferenceChromeMessages,
): readonly {
  value: ReferenceInventoryLifecycleFilter;
  label: string;
}[] {
  return [
    {
      value: REFERENCE_INVENTORY_FILTER_ALL,
      label: chrome?.filter.allLifecycles ?? "All lifecycles",
    },
    ...REFERENCE_LIFECYCLE_STATES.map((state) => ({
      value: state,
      label: referenceLifecycleStateLabel(state, chrome),
    })),
  ];
}

/**
 * Build visibility facet options from published values present on the
 * inventory — never invents visibility strings that are not on any item.
 * Known public/internal tokens use chrome labels; other published tokens stay
 * byte-identical (untranslated contract literals).
 */
export function referenceInventoryVisibilityFilterOptions(
  publishedVisibilities: readonly (string | undefined)[],
  chrome?: ReferenceChromeMessages,
): readonly { value: ReferenceInventoryVisibilityFilter; label: string }[] {
  const unique: string[] = [];
  for (const value of publishedVisibilities) {
    if (value === undefined || value.length === 0) {
      continue;
    }
    if (!unique.includes(value)) {
      unique.push(value);
    }
  }
  unique.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return [
    {
      value: REFERENCE_INVENTORY_FILTER_ALL,
      label: chrome?.filter.allVisibility ?? "All visibility",
    },
    ...unique.map((value) => {
      if (value === "public" || value === "internal") {
        return {
          value,
          label:
            chrome?.visibilityStates[value] ??
            value.charAt(0).toUpperCase() + value.slice(1),
        };
      }
      // Preserve unpublished/custom visibility tokens untranslated.
      return { value, label: value };
    }),
  ];
}
