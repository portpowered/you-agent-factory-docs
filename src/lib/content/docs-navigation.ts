import {
  type LocaleAwareContentProjection,
  projectLocaleAwareContent,
} from "@/lib/content/locale-aware-content-projection";
import { selectLocalizedVariantBinding } from "@/lib/content/localized-content-resolution";
import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import type { CanonicalContentRecord } from "@/lib/content/types";

/** One docs-shell navigation link projected from a canonical content record. */
export type DocsShellNavPage = {
  canonicalId: string;
  label: string;
  href: string;
  order?: number;
  /** Locale-aware metadata for later navigation and search surfaces. */
  localeProjection?: LocaleAwareContentProjection;
};

/** Section grouping for the first generated docs-shell navigation behavior. */
export type DocsShellNavSection = {
  id: string;
  label: string;
  pages: DocsShellNavPage[];
};

/**
 * Projected docs-shell navigation input derived from canonical content records.
 * Named separately from `CanonicalContentRecord` so later breadcrumbs, previous-next
 * links, and in-page table-of-contents inputs can extend this shape without
 * coupling UI state to the canonical content source of truth.
 */
export type DocsShellNavigationInput = {
  sections: DocsShellNavSection[];
};

const NAV_VISIBLE_STATUSES = new Set<CanonicalContentRecord["status"]>([
  "published",
]);

const DEFAULT_SECTION_ID = "general";

function formatSectionLabel(sectionId: string): string {
  return sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
}

function comparePages(left: DocsShellNavPage, right: DocsShellNavPage): number {
  const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.label.localeCompare(right.label);
}

function compareSections(
  left: DocsShellNavSection,
  right: DocsShellNavSection,
): number {
  const leftOrder = Math.min(
    ...left.pages.map((page) => page.order ?? Number.MAX_SAFE_INTEGER),
  );
  const rightOrder = Math.min(
    ...right.pages.map((page) => page.order ?? Number.MAX_SAFE_INTEGER),
  );

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.label.localeCompare(right.label);
}

function dedupeDocRecords(
  records: CanonicalContentRecord[],
  options?: {
    locale?: string;
    variantBindings?: readonly LocalizedContentVariantBinding[];
  },
): CanonicalContentRecord[] {
  if (options?.variantBindings) {
    return selectRepresentativeDocRecords(
      records,
      options.variantBindings,
      options.locale,
    );
  }

  const byId = new Map<string, CanonicalContentRecord>();

  for (const record of records) {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      continue;
    }

    const existingOrder = existing.order ?? Number.MAX_SAFE_INTEGER;
    const nextOrder = record.order ?? Number.MAX_SAFE_INTEGER;
    if (nextOrder < existingOrder) {
      byId.set(record.id, record);
    }
  }

  return [...byId.values()];
}

function selectRepresentativeDocRecords(
  records: readonly CanonicalContentRecord[],
  bindings: readonly LocalizedContentVariantBinding[],
  requestedLocale?: string,
): CanonicalContentRecord[] {
  const docRecordIds = new Set(
    records
      .filter((record) => record.kind === "doc")
      .map((record) => record.id),
  );
  const selected: CanonicalContentRecord[] = [];

  for (const canonicalPageId of docRecordIds) {
    const match = selectLocalizedVariantBinding(
      bindings,
      canonicalPageId,
      requestedLocale,
    );

    if (match) {
      selected.push(match.record);
    }
  }

  return selected;
}

/**
 * Projects the first docs-shell navigation input from canonical content records.
 * Only published doc records are included; other public content kinds are reserved
 * for later navigation surfaces.
 */
export function projectDocsShellNavigation(
  records: readonly CanonicalContentRecord[],
  options?: {
    locale?: string;
    variantBindings?: readonly LocalizedContentVariantBinding[];
  },
): DocsShellNavigationInput {
  const locale = options?.locale;
  const docRecords = records.filter(
    (record) =>
      record.kind === "doc" &&
      NAV_VISIBLE_STATUSES.has(record.status) &&
      (locale === undefined ||
        record.availableLocales.includes(locale) ||
        record.canonicalLocale === locale),
  );
  const uniqueDocRecords = dedupeDocRecords(docRecords, options);
  const sectionsById = new Map<string, DocsShellNavSection>();

  for (const record of uniqueDocRecords) {
    const sectionId = record.section.trim() || DEFAULT_SECTION_ID;
    const section =
      sectionsById.get(sectionId) ??
      ({
        id: sectionId,
        label: formatSectionLabel(sectionId),
        pages: [],
      } satisfies DocsShellNavSection);

    const localeProjection = options?.variantBindings
      ? projectLocaleAwareContent(record.id, {
          requestedLocale: locale,
          variantBindings: options.variantBindings,
        })
      : undefined;

    section.pages.push({
      canonicalId: record.id,
      label: record.navigationTitle,
      href: record.routePath,
      order: record.order,
      localeProjection,
    });
    sectionsById.set(sectionId, section);
  }

  const sections = [...sectionsById.values()].map((section) => ({
    ...section,
    pages: [...section.pages].sort(comparePages),
  }));
  sections.sort(compareSections);

  return { sections };
}
