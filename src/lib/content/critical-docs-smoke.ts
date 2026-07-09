import {
  getContentRoot,
  getDocsRoot,
  getRegistryRoot,
} from "@/lib/content/content-paths";
import type { LocalDocsPageRef } from "@/lib/content/local-docs-page";
import {
  type DocsPageSource,
  type DocsPageSource as LoadedDocsPageSource,
  loadShippedLocalizedDocsPages,
} from "@/lib/content/pages";
import { resolvePublishedResourceTags } from "@/lib/content/phase-1-published-resources";
import { loadRegistry, type RegistryIndexes } from "@/lib/content/registry";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";

export type CriticalDocsSmokeRule = {
  id: string;
  pageKind: DocsPageSource["frontmatter"]["kind"];
  requiredTag: string;
};

export type CriticalDocsSmokeRuleId = string;

/** Atlas critical-page smoke rules retired with Model Atlas domain deletion. */
export const CRITICAL_DOCS_SMOKE_RULES: readonly CriticalDocsSmokeRule[] = [];

/**
 * Shared representative probes for downstream smoke surfaces.
 * These stay behavior-focused and intentionally do not enumerate every
 * discovered critical page; export/search verifiers should consume this
 * projection instead of carrying their own page inventories.
 */
export type CriticalDocsSmokeRepresentativeProbe = {
  id: string;
  criticalRuleId: CriticalDocsSmokeRuleId;
  docsUrl: string;
  exportRoute?: string;
  searchQuery: string;
  searchSurface: "api-and-page" | "api-only";
  purpose: string;
};

export type CriticalDocsSmokeRepresentativeExportRoute = string;

/** Atlas representative smoke probes retired with Model Atlas domain deletion. */
export const CRITICAL_DOCS_SMOKE_REPRESENTATIVE_PROBES: readonly CriticalDocsSmokeRepresentativeProbe[] =
  [];

export const CRITICAL_DOCS_SMOKE_REPRESENTATIVE_EXPORT_ROUTES: readonly CriticalDocsSmokeRepresentativeExportRoute[] =
  [];

export const CRITICAL_DOCS_SMOKE_REPRESENTATIVE_API_SEARCH_PROBES: readonly CriticalDocsSmokeRepresentativeProbe[] =
  [];

export const CRITICAL_DOCS_SMOKE_REPRESENTATIVE_PAGE_SEARCH_QUERIES: readonly string[] =
  [];

/** Base overhead for loading every autodiscovered critical docs page in smoke tests. */
export const CRITICAL_DOCS_AUTODISCOVERY_LOAD_BASE_OVERHEAD_MS = 10_000;
/** Per-page budget for load-only autodiscovery smoke loops. */
export const CRITICAL_DOCS_AUTODISCOVERY_LOAD_PER_PAGE_BUDGET_MS = 500;
/** Base overhead before per-page SSR render work in autodiscovery smoke tests. */
export const CRITICAL_DOCS_AUTODISCOVERY_RENDER_BASE_OVERHEAD_MS = 20_000;
/** Per-page SSR budget for autodiscovery render smoke loops. */
export const CRITICAL_DOCS_AUTODISCOVERY_RENDER_PER_PAGE_BUDGET_MS = 2_000;

export function criticalDocsAutodiscoveryLoadTimeoutMs(
  pageCount: number,
): number {
  return Math.max(
    15_000,
    CRITICAL_DOCS_AUTODISCOVERY_LOAD_BASE_OVERHEAD_MS +
      pageCount * CRITICAL_DOCS_AUTODISCOVERY_LOAD_PER_PAGE_BUDGET_MS,
  );
}

export function criticalDocsAutodiscoveryRenderTimeoutMs(
  pageCount: number,
): number {
  return Math.max(
    45_000,
    CRITICAL_DOCS_AUTODISCOVERY_RENDER_BASE_OVERHEAD_MS +
      pageCount * CRITICAL_DOCS_AUTODISCOVERY_RENDER_PER_PAGE_BUDGET_MS,
  );
}

export type CriticalDocsSmokePage = LoadedDocsPageSource & {
  criticalRuleId: CriticalDocsSmokeRuleId;
  discoveryTags: readonly string[];
};

export type CriticalDocsSmokeLocalRef = LocalDocsPageRef & {
  routeSlug: [string, string];
};

export type LoadCriticalDocsSmokePagesOptions = {
  projectRoot?: string;
  docsRoot?: string;
  registryRoot?: string;
};

export function matchCriticalDocsSmokeRule(input: {
  pageKind: DocsPageSource["frontmatter"]["kind"];
  tags: readonly string[];
}): CriticalDocsSmokeRule | null {
  return (
    CRITICAL_DOCS_SMOKE_RULES.find(
      (rule) =>
        rule.pageKind === input.pageKind &&
        input.tags.includes(rule.requiredTag),
    ) ?? null
  );
}

export function toCriticalDocsSmokeLocalRef(
  page: Pick<CriticalDocsSmokePage, "docsSlug">,
): CriticalDocsSmokeLocalRef {
  const [section, slug, ...rest] = page.docsSlug.split("/");
  if (!section || !slug || rest.length > 0) {
    throw new Error(
      `Critical docs smoke page must use a two-segment docsSlug, got ${page.docsSlug}`,
    );
  }

  return {
    section: section as LocalDocsPageRef["section"],
    slug,
    routeSlug: [section, slug],
  };
}

export function deriveCriticalDocsSmokePages(
  pages: readonly LoadedDocsPageSource[],
  registry: RegistryIndexes,
): readonly CriticalDocsSmokePage[] {
  const discoveredPages: CriticalDocsSmokePage[] = [];

  for (const page of pages) {
    const discoveryTags = resolvePublishedResourceTags(page, registry);
    const rule = matchCriticalDocsSmokeRule({
      pageKind: page.frontmatter.kind,
      tags: discoveryTags,
    });

    if (!rule) {
      continue;
    }

    discoveredPages.push({
      ...page,
      criticalRuleId: rule.id,
      discoveryTags,
    });
  }

  return discoveredPages.sort((left, right) =>
    left.url.localeCompare(right.url, "en"),
  );
}

export async function loadCriticalDocsSmokePages(
  locale: SiteLocale = defaultLocale,
  options: LoadCriticalDocsSmokePagesOptions = {},
): Promise<readonly CriticalDocsSmokePage[]> {
  const contentRoot = options.projectRoot
    ? getContentRoot(options.projectRoot)
    : undefined;
  const docsRoot = options.docsRoot ?? getDocsRoot(contentRoot);
  const registryRoot = options.registryRoot ?? getRegistryRoot(contentRoot);
  const [pages, registry] = await Promise.all([
    loadShippedLocalizedDocsPages(locale, docsRoot),
    loadRegistry({ registryRoot }),
  ]);
  return deriveCriticalDocsSmokePages(pages, registry);
}
