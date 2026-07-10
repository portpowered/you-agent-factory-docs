import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { LoadedTechniquePage } from "./technique-page-load";

export type { LoadedTechniquePage } from "./technique-page-load";

/** Loads a technique MDX page via a dynamic import boundary. */
export async function loadTechniquePage(
  slug: string,
  locale: SiteLocale = defaultLocale,
): Promise<LoadedTechniquePage> {
  const { loadTechniquePageFromDisk } = await import("./technique-page-load");
  return loadTechniquePageFromDisk(slug, locale);
}
