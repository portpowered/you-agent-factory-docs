import {
  DOCS_COLLECTION_IDS,
  type DocsCollectionId,
} from "@/lib/docs/collection-definition-contract";
import { isDeletedAiSearchUrl } from "@/lib/search/factory-search-deleted-records";

/**
 * Reader-visible docs explorer top-level collection folders under locked
 * PS-100: Guides → Program documentation → Concepts → Techniques → Reference.
 * Factories / Workers / Workstations nest under Reference (not top-level peers).
 * Glossary stays reachable via browse, search, and direct routes but is not an
 * explorer folder. Virtual folders (Internal architecture / Miscellanea) are
 * separate section refs — see `FACTORY_EXPLORER_VIRTUAL_FOLDER_IDS`.
 */
export const FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS = [
  // Order follows the four reader-facing groups below: How-tos (guides),
  // References (references, inlined), Information (documentation, concepts,
  // techniques).
  "guides",
  "references",
  "documentation",
  "concepts",
  "techniques",
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
 * Top-level virtual explorer folders that are not docs collection route
 * families. Pages keep existing `/docs/documentation/...` routes.
 */
export const FACTORY_EXPLORER_VIRTUAL_FOLDER_IDS = [
  "internal-architecture",
  "miscellanea",
] as const;

/**
 * Locked PS-100 membership for virtual explorer folders (ordered). Install is
 * intentionally omitted (demoted from explorer; content merge is PS-200).
 */
export const FACTORY_EXPLORER_VIRTUAL_FOLDER_MEMBERSHIP = {
  "internal-architecture": [
    "documentation/architecture-of-system",
    "documentation/petri",
  ],
  miscellanea: [
    "documentation/troubleshooting",
    "documentation/security-trust-boundaries",
    "documentation/contributing-to-these-docs",
  ],
} as const satisfies Record<
  (typeof FACTORY_EXPLORER_VIRTUAL_FOLDER_IDS)[number],
  readonly string[]
>;

/** English default labels for virtual explorer folders. */
export const FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS = {
  "internal-architecture": "Internal architecture",
  miscellanea: "Miscellanea",
} as const satisfies Record<
  (typeof FACTORY_EXPLORER_VIRTUAL_FOLDER_IDS)[number],
  string
>;

/**
 * All collection ids that appear as explorer folders (top-level or nested under
 * Reference). Used for sidebar definitions / folder labels; top-level order is
 * `FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS`. Virtual folders are not
 * collections and are omitted here.
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

export type FactoryExplorerVirtualFolderId =
  (typeof FACTORY_EXPLORER_VIRTUAL_FOLDER_IDS)[number];

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

export type FactoryExplorerVirtualFolderSectionRef = {
  kind: "virtual-folder";
  id: FactoryExplorerVirtualFolderId;
};

export type FactoryExplorerPageSectionRef = {
  kind: "page";
  docsSlug: typeof DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG;
};

/**
 * A collection folder inlined into a top-level group: the collection's children
 * become the group's children and the collection's own folder is dropped.
 *
 * Used for Reference under the References group, where keeping both would nest
 * a folder called "Reference" inside a group called "References".
 */
export type FactoryExplorerInlinedCollectionSectionRef = {
  kind: "inlined-collection";
  id: FactoryExplorerTopLevelCollectionId;
};

/**
 * A page listed directly in a group as a curated entry point.
 *
 * Placement is exclusive: the page is lifted out of whichever collection folder
 * would otherwise own it. Listing the five quick starts in both Quick starts
 * and Guides made the Guides folder read as a superset of the group above it,
 * which is the opposite of what the grouping is for.
 */
export type FactoryExplorerCuratedPageSectionRef = {
  kind: "curated-page";
  docsSlug: string;
};

export type FactoryExplorerSectionRef =
  | FactoryExplorerCollectionSectionRef
  | FactoryExplorerVirtualFolderSectionRef
  | FactoryExplorerPageSectionRef
  | FactoryExplorerInlinedCollectionSectionRef
  | FactoryExplorerCuratedPageSectionRef;

/**
 * The four reader-facing top-level groups.
 *
 * The explorer used to open on eight sibling folders named after how the docs
 * are *authored* — Guides, Program documentation, Concepts, Techniques,
 * Reference, Internal architecture, Miscellanea, FAQ. These four name what a
 * reader is trying to do instead: start, follow a recipe, look something up, or
 * read background. The old folders survive one level down.
 */
export const FACTORY_EXPLORER_TOP_LEVEL_GROUP_IDS = [
  "quick-starts",
  "how-tos",
  "references",
  "information",
] as const;

export type FactoryExplorerTopLevelGroupId =
  (typeof FACTORY_EXPLORER_TOP_LEVEL_GROUP_IDS)[number];

/** English default labels for the four top-level groups. */
export const FACTORY_EXPLORER_TOP_LEVEL_GROUP_LABELS = {
  "quick-starts": "Quick starts",
  "how-tos": "How-tos",
  references: "References",
  information: "Information",
} as const satisfies Record<FactoryExplorerTopLevelGroupId, string>;

/**
 * The ordered onboarding path, shortest useful route first: install it, run
 * something someone else wrote, write your own, drop into JavaScript when the
 * declarative form runs out, then hand the whole thing to an agent.
 */
export const FACTORY_EXPLORER_QUICK_START_DOCS_SLUGS = [
  "documentation/install",
  "guides/run-your-first-factory",
  "guides/write-your-first-factory",
  "guides/write-your-first-javascript",
  "guides/make-your-agent-use-you",
] as const;

/** Ordered member sections for each top-level group. */
export const FACTORY_EXPLORER_TOP_LEVEL_GROUP_MEMBERSHIP: Record<
  FactoryExplorerTopLevelGroupId,
  readonly FactoryExplorerSectionRef[]
> = {
  "quick-starts": FACTORY_EXPLORER_QUICK_START_DOCS_SLUGS.map(
    (docsSlug) =>
      ({
        kind: "curated-page",
        docsSlug,
      }) as const satisfies FactoryExplorerCuratedPageSectionRef,
  ),
  "how-tos": [{ kind: "collection", id: "guides" }],
  references: [{ kind: "inlined-collection", id: "references" }],
  information: [
    { kind: "collection", id: "documentation" },
    { kind: "collection", id: "concepts" },
    // Techniques are patterns to understand rather than recipes to follow, so
    // they read as background alongside Concepts, not as a how-to.
    { kind: "collection", id: "techniques" },
    { kind: "virtual-folder", id: "internal-architecture" },
    { kind: "virtual-folder", id: "miscellanea" },
    { kind: "page", docsSlug: DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG },
  ],
};

export type FactoryExplorerTopLevelGroup = {
  id: FactoryExplorerTopLevelGroupId;
  label: string;
  sections: readonly FactoryExplorerSectionRef[];
};

/** The full top-level explorer structure, in reader-facing order. */
export const FACTORY_EXPLORER_TOP_LEVEL_GROUPS =
  FACTORY_EXPLORER_TOP_LEVEL_GROUP_IDS.map(
    (id) =>
      ({
        id,
        label: FACTORY_EXPLORER_TOP_LEVEL_GROUP_LABELS[id],
        sections: FACTORY_EXPLORER_TOP_LEVEL_GROUP_MEMBERSHIP[id],
      }) satisfies FactoryExplorerTopLevelGroup,
  );

/**
 * Every section ref in reader-facing order, flattened across the four groups.
 *
 * Derived rather than declared so the group membership above stays the single
 * place the explorer's shape is edited; `assertFactoryExplorerSectionOrder`
 * checks a built tree against this.
 */
export const FACTORY_EXPLORER_SECTION_ORDER =
  FACTORY_EXPLORER_TOP_LEVEL_GROUPS.flatMap(
    (group) => group.sections,
  ) as readonly FactoryExplorerSectionRef[];

const QUICK_START_DOCS_SLUG_SET = new Set<string>(
  FACTORY_EXPLORER_QUICK_START_DOCS_SLUGS,
);

/** True when a page is claimed by the Quick starts group. */
export function isDocsExplorerQuickStartPage(docsSlug: string): boolean {
  return QUICK_START_DOCS_SLUG_SET.has(docsSlug);
}

const VIRTUAL_FOLDER_DOCS_SLUG_SET = new Set<string>(
  Object.values(FACTORY_EXPLORER_VIRTUAL_FOLDER_MEMBERSHIP).flat(),
);
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
 * top-level collection contract (Guides → Program documentation → Concepts →
 * Techniques → Reference; Glossary is not an explorer folder; Factories /
 * Workers / Workstations nest under Reference; virtual folders are separate).
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

  if (section.kind === "collection" || section.kind === "inlined-collection") {
    return `${section.kind}:${section.id}`;
  }

  if (section.kind === "virtual-folder") {
    return `virtual-folder:${section.id}`;
  }

  return `${section.kind}:${section.docsSlug}`;
}

/**
 * Fail closed when the full explorer top-level order drifts from the
 * collection-folder + virtual-folder + top-level FAQ contract.
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
        (
          section,
        ): section is
          | FactoryExplorerCollectionSectionRef
          | FactoryExplorerInlinedCollectionSectionRef =>
          // An inlined collection is still a collection in the order contract —
          // it just contributes its children instead of its folder.
          section.kind === "collection" ||
          section.kind === "inlined-collection",
      )
      .map((section) => section.id),
  );
}

export function isDocsExplorerTopLevelFaqPage(docsSlug: string): boolean {
  return docsSlug === DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG;
}

export function isDocsExplorerVirtualFolderPage(docsSlug: string): boolean {
  return VIRTUAL_FOLDER_DOCS_SLUG_SET.has(docsSlug);
}

export function resolveFactoryExplorerVirtualFolderLabel(
  id: FactoryExplorerVirtualFolderId,
): string {
  return FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS[id];
}

export function listFactoryExplorerVirtualFolderMembership(
  id: FactoryExplorerVirtualFolderId,
): readonly string[] {
  return FACTORY_EXPLORER_VIRTUAL_FOLDER_MEMBERSHIP[id];
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
