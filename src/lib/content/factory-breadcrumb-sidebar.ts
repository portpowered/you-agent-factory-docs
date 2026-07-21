import {
  DOCS_COLLECTION_IDS,
  type DocsCollectionId,
} from "@/lib/docs/collection-definition-contract";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import { isDeletedAiSearchUrl } from "@/lib/search/factory-search-deleted-records";

/**
 * Reader-visible docs explorer folder order: CLI collections, then Reference.
 * Factories / Workers / Workstations nest under Reference (not top-level peers).
 * Glossary stays reachable via browse, search, and direct routes but is not an
 * explorer folder.
 */
export const FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS = [
  ...CLI_DOCS_COLLECTION_IDS,
  "references",
] as const satisfies readonly DocsCollectionId[];

/**
 * W15 route-family collections nested under the Reference explorer folder.
 */
export const FACTORY_REFERENCE_NESTED_COLLECTION_IDS = [
  "factories",
  "workers",
  "workstations",
] as const satisfies readonly DocsCollectionId[];

/**
 * All collection ids that appear as explorer folders (top-level or nested under
 * Reference). Used for sidebar definitions / folder labels; top-level order is
 * `FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS`.
 */
export const FACTORY_SIDEBAR_COLLECTION_IDS = [
  ...FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS,
  ...FACTORY_REFERENCE_NESTED_COLLECTION_IDS,
] as const satisfies readonly DocsCollectionId[];

/**
 * Factory nav collection ids used for breadcrumb / collection validation.
 * Includes glossary so glossary crumbs and route sections stay valid even
 * though glossary is omitted from the explorer folder list.
 */
export const FACTORY_NAV_COLLECTION_IDS = DOCS_COLLECTION_IDS;

export type FactorySidebarCollectionId =
  (typeof FACTORY_SIDEBAR_COLLECTION_IDS)[number];

export type FactoryExplorerTopLevelCollectionId =
  (typeof FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS)[number];

export type FactoryReferenceNestedCollectionId =
  (typeof FACTORY_REFERENCE_NESTED_COLLECTION_IDS)[number];

export type FactoryNavCollectionId = DocsCollectionId;

/**
 * FAQ stays on its published documentation route but is promoted out of the
 * Program documentation folder into a top-level explorer page entry.
 */
export const DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG =
  "documentation/faq" as const;

export const DOCS_EXPLORER_TOP_LEVEL_FAQ_URL =
  "/docs/documentation/faq" as const;

export type FactoryExplorerCollectionSectionRef = {
  kind: "collection";
  id: FactoryExplorerTopLevelCollectionId;
};

export type FactoryExplorerPageSectionRef = {
  kind: "page";
  docsSlug: typeof DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG;
};

export type FactoryExplorerSectionRef =
  | FactoryExplorerCollectionSectionRef
  | FactoryExplorerPageSectionRef;

/**
 * Full explorer top-level order: CLI + Reference collection folders, then FAQ
 * as a sibling page entry outside Program documentation. Factories / Workers /
 * Workstations are nested under Reference (see
 * `FACTORY_REFERENCE_NESTED_COLLECTION_IDS`).
 */
export const FACTORY_EXPLORER_SECTION_ORDER = [
  ...FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS.map(
    (id) =>
      ({
        kind: "collection",
        id,
      }) as const satisfies FactoryExplorerCollectionSectionRef,
  ),
  {
    kind: "page",
    docsSlug: DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG,
  } as const satisfies FactoryExplorerPageSectionRef,
] as const satisfies readonly FactoryExplorerSectionRef[];

/**
 * Explorer-visible page-tree root / brand name for the docs sidebar chrome.
 * Technical package/repo/route identifiers remain literal `you-agent-factory`.
 */
export const DOCS_PAGE_TREE_ROOT_NAME = "You Agent Factory" as const;

/**
 * Sidebar folder labels and breadcrumb collection crumb labels for factory
 * docs collections. Retired Atlas folder names are not part of this map.
 * Documentation's explorer label is Program documentation; Reference (singular)
 * is the locked PS-100 folder label; glossary keeps a crumb label for direct
 * glossary routes outside the explorer folder list.
 */
export const FACTORY_SIDEBAR_FOLDER_LABELS = {
  guides: "Guides",
  concepts: "Concepts",
  techniques: "Techniques",
  documentation: "Program documentation",
  glossary: "Glossary",
  references: "Reference",
  factories: "Factories",
  workers: "Workers",
  workstations: "Workstations",
} as const satisfies Record<FactoryNavCollectionId, string>;

/** Explorer folder labels (top-level + nested under Reference; no Glossary). */
export const FACTORY_EXPLORER_FOLDER_LABELS = {
  guides: FACTORY_SIDEBAR_FOLDER_LABELS.guides,
  concepts: FACTORY_SIDEBAR_FOLDER_LABELS.concepts,
  techniques: FACTORY_SIDEBAR_FOLDER_LABELS.techniques,
  documentation: FACTORY_SIDEBAR_FOLDER_LABELS.documentation,
  references: FACTORY_SIDEBAR_FOLDER_LABELS.references,
  factories: FACTORY_SIDEBAR_FOLDER_LABELS.factories,
  workers: FACTORY_SIDEBAR_FOLDER_LABELS.workers,
  workstations: FACTORY_SIDEBAR_FOLDER_LABELS.workstations,
} as const satisfies Record<FactorySidebarCollectionId, string>;

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
 * Fail closed when sidebar collection-folder order drifts from the explorer
 * top-level folder contract (CLI + Reference; Glossary is not an explorer
 * folder; Factories / Workers / Workstations nest under Reference).
 */
export function assertFactorySidebarSectionOrder(
  sectionIds: readonly string[],
): void {
  if (sectionIds.length !== FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS.length) {
    throw new Error(
      `Docs sidebar section order length ${sectionIds.length} does not match factory explorer top-level collections (${FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS.join(", ")}).`,
    );
  }

  for (
    let index = 0;
    index < FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS.length;
    index += 1
  ) {
    const expected = FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS[index];
    const actual = sectionIds[index];
    if (actual !== expected) {
      throw new Error(
        `Docs sidebar section order mismatch at index ${index}: expected "${expected}", got "${actual ?? "(missing)"}".`,
      );
    }
  }
}

function describeExplorerSectionRef(
  section: FactoryExplorerSectionRef | undefined,
): string {
  if (!section) {
    return "(missing)";
  }

  if (section.kind === "collection") {
    return `collection:${section.id}`;
  }

  return `page:${section.docsSlug}`;
}

/**
 * Fail closed when the full explorer top-level order drifts from the
 * collection-folder + top-level FAQ contract.
 */
export function assertFactoryExplorerSectionOrder(
  sections: ReadonlyArray<FactoryExplorerSectionRef>,
): void {
  if (sections.length !== FACTORY_EXPLORER_SECTION_ORDER.length) {
    throw new Error(
      `Docs explorer section order length ${sections.length} does not match factory explorer contract (${FACTORY_EXPLORER_SECTION_ORDER.map(describeExplorerSectionRef).join(", ")}).`,
    );
  }

  for (
    let index = 0;
    index < FACTORY_EXPLORER_SECTION_ORDER.length;
    index += 1
  ) {
    const expected = FACTORY_EXPLORER_SECTION_ORDER[index];
    const actual = sections[index];
    const expectedKey = describeExplorerSectionRef(expected);
    const actualKey = describeExplorerSectionRef(actual);

    if (actualKey !== expectedKey) {
      throw new Error(
        `Docs explorer section order mismatch at index ${index}: expected "${expectedKey}", got "${actualKey}".`,
      );
    }
  }

  assertFactorySidebarSectionOrder(
    sections
      .filter(
        (section): section is FactoryExplorerCollectionSectionRef =>
          section.kind === "collection",
      )
      .map((section) => section.id),
  );
}

export function isDocsExplorerTopLevelFaqPage(docsSlug: string): boolean {
  return docsSlug === DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG;
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
