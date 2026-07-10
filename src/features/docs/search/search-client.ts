"use client";

import { type StaticOptions, useDocsSearch } from "fumadocs-core/search/client";
import type { DependencyList } from "react";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { DOCS_SEARCH_API_PATH } from "@/lib/search/docs-search-bootstrap-path";
import { modelAtlasOramaSearchClient } from "./model-atlas-search-client";
import type { SearchResultMetaRecord } from "./search-result-meta-client";

export { DOCS_SEARCH_API_PATH } from "@/lib/search/docs-search-bootstrap-path";

/**
 * Reads the bootstrap path baked into the client bundle.
 *
 * Must use a literal `process.env.NEXT_PUBLIC_*` access so Next.js SWC/webpack
 * inlines the value from `next.config.ts` into static-export client chunks.
 * Dynamic `env[key]` access is not inlined and would leave only `/api/search`.
 */
export function readBakedDocsSearchStaticFrom(): string {
  return (
    process.env.NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM ?? DOCS_SEARCH_API_PATH
  );
}

function resolveBakedDocsSearchBootstrapFromForLocale(
  locale: SiteLocale,
): string {
  const bakedDocsSearchBootstrapFrom = readBakedDocsSearchStaticFrom();
  if (locale === defaultLocale) {
    return bakedDocsSearchBootstrapFrom;
  }

  return bakedDocsSearchBootstrapFrom === DOCS_SEARCH_API_PATH
    ? `${DOCS_SEARCH_API_PATH}?locale=${encodeURIComponent(locale)}`
    : `${bakedDocsSearchBootstrapFrom}.${locale}`;
}

export const docsSearchStaticOptions = {
  type: "static",
  from: readBakedDocsSearchStaticFrom(),
} as const satisfies { type: "static" } & StaticOptions;

export function buildDocsSearchStaticOptions(
  locale: SiteLocale = defaultLocale,
): { type: "static" } & StaticOptions {
  return {
    type: "static",
    from: resolveBakedDocsSearchBootstrapFromForLocale(locale),
  };
}

export type ModelAtlasDocsSearchOptions = {
  metaByUrl: SearchResultMetaRecord;
  locale?: SiteLocale;
  client?: StaticOptions;
  classification?: string | null;
};

export function createModelAtlasSearchClient({
  metaByUrl,
  locale = defaultLocale,
  client = buildDocsSearchStaticOptions(locale),
  classification,
}: ModelAtlasDocsSearchOptions) {
  return modelAtlasOramaSearchClient(client, metaByUrl, { classification });
}

/** @deprecated Use createModelAtlasSearchClient */
export const createDocsSearchClient = createModelAtlasSearchClient;

export function useModelAtlasDocsSearch(
  {
    metaByUrl,
    locale = defaultLocale,
    client = buildDocsSearchStaticOptions(locale),
    classification,
  }: ModelAtlasDocsSearchOptions,
  deps?: DependencyList,
) {
  return useDocsSearch(
    {
      client: createModelAtlasSearchClient({
        metaByUrl,
        locale,
        client,
        classification,
      }),
    },
    deps,
  );
}
