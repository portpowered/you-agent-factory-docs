import type { PageKind, RegistryKind } from "@/lib/content/schemas";

/**
 * Stable ids for docs collections.
 * Includes rewrite-era empty CLI collections plus remaining Atlas collections
 * until sibling delete/retarget lanes remove Atlas inventory.
 */
export type DocsCollectionId =
  | "guides"
  | "concepts"
  | "techniques"
  | "documentation"
  | "glossary"
  | "modules"
  | "models"
  | "papers"
  | "training"
  | "systems";

export const DOCS_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
  "glossary",
  "modules",
  "models",
  "papers",
  "training",
  "systems",
] as const satisfies readonly DocsCollectionId[];

/** Public route slug segment under `/docs`. */
export type DocsCollectionRouteSlug = DocsCollectionId;

/** Registry kinds referenced by published docs collection pages. */
export type DocsCollectionRegistryKind = Extract<
  RegistryKind,
  | "guide"
  | "concept"
  | "technique"
  | "documentation"
  | "module"
  | "model"
  | "paper"
  | "training-regime"
  | "system"
>;

/** Frontmatter kinds on published docs collection pages. */
export type DocsCollectionFrontmatterKind = Extract<
  PageKind,
  | "guide"
  | "concept"
  | "technique"
  | "documentation"
  | "glossary"
  | "module"
  | "model"
  | "paper"
  | "training-regime"
  | "system"
>;

/**
 * Identifies sidebar grouping behavior for collections that partition pages
 * into labeled groups. Models, papers, and empty CLI collections that sort
 * directly by page title omit this field.
 */
export const DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS = [
  "glossary",
  "concepts",
  "modules",
  "training",
  "systems",
] as const;

export type DocsCollectionSidebarGroupingResolverId =
  (typeof DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS)[number];

/** Message key paths for browse cards and section index pages. */
export type ShellCollectionMessageKeys = {
  browse: {
    sectionTitle: string;
    sectionDescription: string;
    sectionLinkLabel: string;
  };
  index: {
    title: string;
    description: string;
    listLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyHomeLink: string;
  };
};

/** Message key paths in `UiMessages` for browse cards and section index pages. */
export type DocsCollectionMessageKeys = ShellCollectionMessageKeys;

/**
 * Generic shell collection contract for browse, section index, sidebar, and
 * search consumers. AI docs collections specialize this shape.
 */
export type ShellCollectionDefinition<
  TId extends string = string,
  TRouteSlug extends string = string,
  TFrontmatterKind extends string = string,
  TRegistryKind extends string = string,
> = {
  id: TId;
  /** Route slug segment under the docs surface. Independent from `frontmatterKind`. */
  routeSlug: TRouteSlug;
  registryKind: TRegistryKind;
  /** Frontmatter kind on collection pages. Independent from `routeSlug`. */
  frontmatterKind: TFrontmatterKind;
  /** Route-relative docs slugs featured on the browse page for this collection. */
  starterSlugs: readonly string[];
  messageKeys: ShellCollectionMessageKeys;
  /** Sidebar folder label for page-tree generation. */
  sidebarLabel: string;
  sidebarGroupingResolverId?: string;
};

/**
 * Typed contract for a docs collection before runtime consumers migrate to
 * shared config.
 */
export type DocsCollectionDefinition = Omit<
  ShellCollectionDefinition<
    DocsCollectionId,
    DocsCollectionRouteSlug,
    DocsCollectionFrontmatterKind,
    DocsCollectionRegistryKind
  >,
  "sidebarLabel"
> & {
  sidebarGroupingResolverId?: DocsCollectionSidebarGroupingResolverId;
};

export function isDocsCollectionSidebarGroupingResolverId(
  value: string,
): value is DocsCollectionSidebarGroupingResolverId {
  return (
    DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS as readonly string[]
  ).includes(value);
}
