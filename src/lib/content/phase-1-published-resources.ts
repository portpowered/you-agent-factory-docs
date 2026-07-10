import type { DocsPageSource } from "@/lib/content/pages";
import {
  getRegistryRecord,
  type RegistryIndexes,
} from "@/lib/content/registry-index";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";

function uniqueTagSlugs(tagSlugs: readonly string[]): string[] {
  return [...new Set(tagSlugs.filter(Boolean))];
}

/**
 * Merges published page frontmatter tags with registry record tags.
 * Tag landing and search both derive discoverability from this rule.
 */
export function resolvePublishedResourceTags(
  page: DocsPageSource,
  indexes: RegistryIndexes,
): string[] {
  const registryRecord = getRegistryRecord(
    indexes,
    page.frontmatter.registryId,
  );
  const registryTags = registryRecord?.tags ?? [];
  return uniqueTagSlugs([...page.frontmatter.tags, ...registryTags]);
}

/** True when a published docs page belongs to the given tag slug. */
export function publishedResourceMatchesTag(
  page: DocsPageSource,
  tagSlug: string,
  indexes: RegistryIndexes,
): boolean {
  return resolvePublishedResourceTags(page, indexes).includes(tagSlug);
}

/** Published docs pages discoverable under a tag slug via the canonical Phase 1 rule. */
export async function loadPublishedResourcesForTag(
  tagSlug: string,
  locale: SiteLocale = defaultLocale,
): Promise<DocsPageSource[]> {
  const { loadRegistry } = await import("./registry");
  const { loadShippedLocalizedDocsPages } = await import("./pages");
  const indexes = await loadRegistry();
  const pages = await loadShippedLocalizedDocsPages(locale);
  return pages.filter((page) =>
    publishedResourceMatchesTag(page, tagSlug, indexes),
  );
}
