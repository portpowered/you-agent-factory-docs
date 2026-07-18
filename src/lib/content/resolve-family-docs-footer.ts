import {
  isDirectDocsRouteFamilyId,
  isDirectDocsRouteFamilySlug,
} from "@/lib/content/docs-catch-all-static-params";
import {
  resolveFamilyScopedDocsFooterNeighbors,
  toFamilyDocsPageFooterOptions,
} from "@/lib/content/factory-prev-next-related";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";

export type FamilyDocsPageFooterOptions = NonNullable<
  ReturnType<typeof toFamilyDocsPageFooterOptions>
>;

/**
 * Resolve DocsPage footer options for a W15 family docs slug (index or
 * nested). Uses the locale-pruned page tree so neighbors stay on shipped
 * family destinations. Returns undefined for non-family slugs.
 */
export async function resolveFamilyDocsPageFooterOptions(
  docsSlug: string,
  locale: SiteLocale = defaultLocale,
): Promise<FamilyDocsPageFooterOptions | undefined> {
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

  return toFamilyDocsPageFooterOptions(neighbors);
}
