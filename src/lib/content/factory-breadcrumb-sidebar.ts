import {
  DOCS_COLLECTION_IDS,
  type DocsCollectionId,
} from "@/lib/docs/collection-definition-contract";
import { isDeletedAiSearchUrl } from "@/lib/search/factory-search-deleted-records";

/**
 * Reader-visible docs sidebar / breadcrumb collection order after domain
 * cleanup. Matches `DOCS_COLLECTION_IDS` (guides → glossary).
 */
export const FACTORY_NAV_COLLECTION_IDS = DOCS_COLLECTION_IDS;

export type FactoryNavCollectionId = DocsCollectionId;

/**
 * Sidebar folder labels and breadcrumb collection crumb labels for factory
 * docs collections. Retired Atlas folder names are not part of this map.
 */
export const FACTORY_SIDEBAR_FOLDER_LABELS = {
  guides: "Guides",
  concepts: "Concepts",
  techniques: "Techniques",
  documentation: "Documentation",
  glossary: "Glossary",
} as const satisfies Record<FactoryNavCollectionId, string>;

/**
 * Deleted Atlas collection route ids that must never appear as breadcrumb
 * collection crumbs or sidebar folder destinations.
 */
export const RETIRED_ATLAS_NAV_COLLECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
] as const;

export type RetiredAtlasNavCollectionId =
  (typeof RETIRED_ATLAS_NAV_COLLECTION_IDS)[number];

/**
 * Retired Atlas sidebar / breadcrumb labels that must not appear in live
 * factory navigation chrome.
 */
export const RETIRED_ATLAS_NAV_FOLDER_LABELS = [
  "Models",
  "Modules",
  "Papers",
  "Training",
  "Systems",
  "Model Types",
  "Inference",
  "Module Components",
] as const;

const FACTORY_NAV_COLLECTION_ID_SET = new Set<string>(
  FACTORY_NAV_COLLECTION_IDS,
);
const RETIRED_ATLAS_NAV_COLLECTION_ID_SET = new Set<string>(
  RETIRED_ATLAS_NAV_COLLECTION_IDS,
);
const RETIRED_ATLAS_NAV_FOLDER_LABEL_SET = new Set<string>(
  RETIRED_ATLAS_NAV_FOLDER_LABELS,
);

export function isFactoryNavCollectionId(
  value: string,
): value is FactoryNavCollectionId {
  return FACTORY_NAV_COLLECTION_ID_SET.has(value);
}

export function isRetiredAtlasNavCollectionId(value: string): boolean {
  return RETIRED_ATLAS_NAV_COLLECTION_ID_SET.has(value);
}

export function resolveFactorySidebarFolderLabel(
  id: FactoryNavCollectionId,
): string {
  return FACTORY_SIDEBAR_FOLDER_LABELS[id];
}

/**
 * Fail closed when a breadcrumb collection section is outside the factory
 * nav set (including retired Atlas collection ids).
 */
export function assertFactoryNavCollectionId(section: string): void {
  if (isFactoryNavCollectionId(section)) {
    return;
  }

  throw new Error(
    `Docs navigation collection "${section}" is outside the factory nav set (${FACTORY_NAV_COLLECTION_IDS.join(", ")}).`,
  );
}

/**
 * Fail closed when breadcrumb segments advertise retired Atlas collection
 * labels or `/docs/{atlas}` hrefs.
 */
export function assertFactoryBreadcrumbSegments(
  segments: ReadonlyArray<{ label: string; href?: string }>,
): void {
  for (const segment of segments) {
    if (RETIRED_ATLAS_NAV_FOLDER_LABEL_SET.has(segment.label)) {
      throw new Error(
        `Breadcrumb label "${segment.label}" is a retired Atlas navigation label and must not appear on factory docs pages.`,
      );
    }

    if (!segment.href) {
      continue;
    }

    if (isDeletedAiSearchUrl(segment.href)) {
      throw new Error(
        `Breadcrumb href "${segment.href}" points at deleted Atlas inventory and must not appear on factory docs pages.`,
      );
    }

    const docsMatch = segment.href.match(/\/docs\/([^/]+)(?:\/|$)/);
    const section = docsMatch?.[1];
    if (section && isRetiredAtlasNavCollectionId(section)) {
      throw new Error(
        `Breadcrumb href "${segment.href}" uses retired Atlas collection "${section}" and must not appear on factory docs pages.`,
      );
    }
  }
}

/**
 * Fail closed when sidebar section order drifts from the factory collection
 * contract.
 */
export function assertFactorySidebarSectionOrder(
  sectionIds: readonly string[],
): void {
  if (sectionIds.length !== FACTORY_NAV_COLLECTION_IDS.length) {
    throw new Error(
      `Docs sidebar section order length ${sectionIds.length} does not match factory nav collections (${FACTORY_NAV_COLLECTION_IDS.join(", ")}).`,
    );
  }

  for (let index = 0; index < FACTORY_NAV_COLLECTION_IDS.length; index += 1) {
    const expected = FACTORY_NAV_COLLECTION_IDS[index];
    const actual = sectionIds[index];
    if (actual !== expected) {
      throw new Error(
        `Docs sidebar section order mismatch at index ${index}: expected "${expected}", got "${actual ?? "(missing)"}".`,
      );
    }
  }
}

/**
 * Fail closed when a sidebar page URL points at deleted Atlas inventory.
 */
export function assertFactorySidebarPageUrl(url: string): void {
  if (!isDeletedAiSearchUrl(url)) {
    return;
  }

  throw new Error(
    `Docs sidebar URL "${url}" points at deleted Atlas inventory and must not appear in factory navigation chrome.`,
  );
}

export function assertFactorySidebarPageUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    assertFactorySidebarPageUrl(url);
  }
}

/**
 * Fail closed when a sidebar folder label is a retired Atlas navigation label.
 */
export function assertFactorySidebarFolderLabel(label: string): void {
  if (!RETIRED_ATLAS_NAV_FOLDER_LABEL_SET.has(label)) {
    return;
  }

  throw new Error(
    `Docs sidebar folder "${label}" is a retired Atlas navigation label and must not appear in factory navigation chrome.`,
  );
}

export function assertFactorySidebarFolderLabels(
  labels: Iterable<string>,
): void {
  for (const label of labels) {
    assertFactorySidebarFolderLabel(label);
  }
}
