import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type {
  LoadedRouteFamilyLocalDocsPage,
  RouteFamilyLocalDocsSection,
} from "./route-family-local-docs-page-load";

export type {
  LoadedRouteFamilyLocalDocsPage,
  RouteFamilyLocalDocsSection,
} from "./route-family-local-docs-page-load";
export { ROUTE_FAMILY_LOCAL_DOCS_SECTIONS } from "./route-family-local-docs-page-load";

/** Loads a route-family local docs page via a dynamic import boundary. */
export async function loadRouteFamilyLocalDocsPage(
  section: RouteFamilyLocalDocsSection,
  slug: string,
  locale: SiteLocale = defaultLocale,
  docsRoot?: string,
): Promise<LoadedRouteFamilyLocalDocsPage> {
  const { loadRouteFamilyLocalDocsPageFromDisk } = await import(
    "./route-family-local-docs-page-load"
  );
  return loadRouteFamilyLocalDocsPageFromDisk(section, slug, locale, docsRoot);
}
