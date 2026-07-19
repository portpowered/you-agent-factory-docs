import type { DocsIndexEntry } from "@/features/docs/components/DocsIndexEntryList";
import type { DocsPageSource } from "@/lib/content/pages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import type { ShellCollectionDefinition } from "@/lib/docs/collection-definition-contract";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import { toDocsIndexEntries } from "@/lib/docs/docs-index-entries";
import { resolveUiMessagePath } from "@/lib/docs/section-collection-index";
import {
  buildLocalizedRoute,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { isDocumentationRouteMigrationOldBrowsePath } from "@/lib/seo/documentation-route-migration";

/**
 * Reader-visible browse collection order for the rewrite-era CLI docs taxonomy.
 * Public docs collection inventory is factory-only; default browse hub sections
 * are the four CLI collections. Glossary-derived Atlas browse sections
 * (Model Types / Inference / Module Components) are deleted and must not return.
 */
export const DOCS_BROWSE_COLLECTION_IDS = CLI_DOCS_COLLECTION_IDS;

type DocsBrowseCollectionId = (typeof DOCS_BROWSE_COLLECTION_IDS)[number];

export type DocsBrowseSectionRef = {
  kind: "collection";
  id: DocsBrowseCollectionId | string;
};

/** Default browse hub order: the four CLI collections. */
export const DOCS_BROWSE_SECTION_ORDER = [
  { kind: "collection", id: "guides" },
  { kind: "collection", id: "concepts" },
  { kind: "collection", id: "techniques" },
  { kind: "collection", id: "documentation" },
] as const satisfies readonly DocsBrowseSectionRef[];

export type BrowseCollectionSection = {
  id: string;
  title: string;
  description: string;
  entries: DocsIndexEntry[];
  linkLabel?: string;
  linkHref?: string;
};

export type ShellCollectionPageSource = {
  docsSlug: string;
  url: string;
  messages: { title: string; description: string };
  frontmatter: { kind: string };
};

function defaultResolveBrowseSectionLinkHref(
  definition: Pick<ShellCollectionDefinition, "id" | "routeSlug">,
  locale: SiteLocale,
): string {
  // Glossary index routes are retired; collection linkHref still resolves via
  // the docs-page slug path so callers do not keep a hollow glossary-index
  // surface dependency. Public browse hubs omit glossary entirely.
  return buildLocalizedRoute(
    { surface: "docs-page", slug: definition.routeSlug },
    locale,
  );
}

export type ShellCollectionBrowseDefinition = Pick<
  ShellCollectionDefinition,
  "id" | "routeSlug" | "frontmatterKind" | "starterSlugs" | "messageKeys"
>;

function buildBrowseCollectionSection(
  definition: ShellCollectionBrowseDefinition,
  pages: readonly ShellCollectionPageSource[],
  locale: SiteLocale,
  messages: Record<string, unknown>,
  resolveSectionLinkHref: (
    definition: ShellCollectionBrowseDefinition,
    locale: SiteLocale,
  ) => string,
): BrowseCollectionSection {
  const collectionPages = pages.filter(
    (page) =>
      page.frontmatter.kind === definition.frontmatterKind &&
      // W18: keep §10 old compatibility pages out of browse; family targets remain.
      !isDocumentationRouteMigrationOldBrowsePath(page.url) &&
      !isDocumentationRouteMigrationOldBrowsePath(page.docsSlug),
  );

  return {
    id: definition.id,
    title: resolveUiMessagePath(
      messages,
      definition.messageKeys.browse.sectionTitle,
    ),
    description: resolveUiMessagePath(
      messages,
      definition.messageKeys.browse.sectionDescription,
    ),
    entries: toDocsIndexEntries(collectionPages, locale, [
      ...definition.starterSlugs,
    ]),
    linkLabel: resolveUiMessagePath(
      messages,
      definition.messageKeys.browse.sectionLinkLabel,
    ),
    linkHref: resolveSectionLinkHref(definition, locale),
  };
}

export function buildBrowseCollectionSections({
  pages,
  locale,
  messages,
  definitions = listDocsCollectionDefinitions(),
  browseCollectionIds = DOCS_BROWSE_COLLECTION_IDS,
  resolveSectionLinkHref = defaultResolveBrowseSectionLinkHref,
}: {
  pages: readonly ShellCollectionPageSource[] | readonly DocsPageSource[];
  locale: SiteLocale;
  messages: UiMessages | Record<string, unknown>;
  definitions?: readonly ShellCollectionBrowseDefinition[];
  browseCollectionIds?: readonly string[];
  resolveSectionLinkHref?: (
    definition: ShellCollectionBrowseDefinition,
    locale: SiteLocale,
  ) => string;
}): BrowseCollectionSection[] {
  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return browseCollectionIds.map((id) => {
    const definition = definitionsById.get(id);
    if (!definition) {
      throw new Error(`Missing collection definition for browse id: ${id}`);
    }

    return buildBrowseCollectionSection(
      definition,
      pages,
      locale,
      messages,
      resolveSectionLinkHref,
    );
  });
}

export function buildDocsBrowseSections({
  pages,
  locale,
  messages,
  definitions = listDocsCollectionDefinitions(),
  sectionOrder = DOCS_BROWSE_SECTION_ORDER,
  resolveSectionLinkHref = defaultResolveBrowseSectionLinkHref,
}: {
  pages: readonly ShellCollectionPageSource[] | readonly DocsPageSource[];
  locale: SiteLocale;
  messages: UiMessages | Record<string, unknown>;
  definitions?: readonly ShellCollectionBrowseDefinition[];
  sectionOrder?: readonly DocsBrowseSectionRef[];
  resolveSectionLinkHref?: (
    definition: ShellCollectionBrowseDefinition,
    locale: SiteLocale,
  ) => string;
}): BrowseCollectionSection[] {
  return buildBrowseCollectionSections({
    pages,
    locale,
    messages,
    definitions,
    browseCollectionIds: sectionOrder.map((sectionRef) => sectionRef.id),
    resolveSectionLinkHref,
  });
}
