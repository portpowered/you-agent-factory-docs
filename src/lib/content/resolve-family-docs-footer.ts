import {
  isDirectDocsRouteFamilyId,
  isDirectDocsRouteFamilySlug,
} from "@/lib/content/docs-catch-all-static-params";
import {
  type FactoryFooterNeighbors,
  resolveFamilyScopedDocsFooterNeighbors,
} from "@/lib/content/factory-prev-next-related";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";

/**
 * Resolve family-scoped previous/next neighbors for a W15 family docs slug
 * (index or nested). Uses the locale-pruned page tree. Returns undefined for
 * non-family slugs or when both directions are omitted.
 */
export async function resolveFamilyDocsFooterNeighborsForSlug(
  docsSlug: string,
  locale: SiteLocale = defaultLocale,
): Promise<FactoryFooterNeighbors | undefined> {
  if (!isDirectDocsRouteFamilySlug(docsSlug)) {
    return undefined;
  }

  const section = docsSlug.split("/")[0];
  if (!section || !isDirectDocsRouteFamilyId(section)) {
    return undefined;
  }

  const [{ source }, messages] = await Promise.all([
    import("@/lib/source"),
    loadUiMessages(locale),
  ]);
  const pageTree = localizePageTree(source.pageTree, locale, { messages });
  const url = buildLocalizedRoute(
    { surface: "docs-page", slug: docsSlug },
    locale,
  );
  const neighbors = resolveFamilyScopedDocsFooterNeighbors(pageTree, url, {
    indexLabel: messages.nav[section],
    locale,
  });

  if (neighbors === null) {
    return undefined;
  }
  if (!neighbors.previous && !neighbors.next) {
    return undefined;
  }
  return neighbors;
}
