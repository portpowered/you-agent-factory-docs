import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { LoadedGuidePage } from "./guide-page-load";

export type { LoadedGuidePage } from "./guide-page-load";

/** Loads a guide MDX page via a dynamic import boundary. */
export async function loadGuidePage(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<LoadedGuidePage> {
  const { loadGuidePageFromDisk } = await import("./guide-page-load");
  return loadGuidePageFromDisk(slug, locale);
}
