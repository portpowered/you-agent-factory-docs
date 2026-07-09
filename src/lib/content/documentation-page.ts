import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { LoadedDocumentationPage } from "./documentation-page-load";

export type { LoadedDocumentationPage } from "./documentation-page-load";

/** Loads a documentation MDX page via a dynamic import boundary. */
export async function loadDocumentationPage(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<LoadedDocumentationPage> {
  const { loadDocumentationPageFromDisk } = await import(
    "./documentation-page-load"
  );
  return loadDocumentationPageFromDisk(slug, locale);
}
