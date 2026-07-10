import { beforeEach, describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import type { BlogSearchPostSource } from "@/lib/search/build-blog-search-document";
import {
  getSearchDocumentBuildCountForTests,
  loadSearchDocumentsByLocale,
  resetSearchDocumentBuildCountForTests,
} from "./load-search-documents";

function emptyIndexes(): RegistryIndexes {
  return {
    byId: new Map(),
    bySlug: new Map(),
    classificationsById: new Map(),
    tagsById: new Map(),
    tagsBySlug: new Map(),
  };
}

function syntheticPage(locale: string): DocsPageSource {
  return {
    pageDir: `/tmp/${locale}/getting-started`,
    docsSlug: "guides/getting-started",
    url:
      locale === "en"
        ? "/docs/guides/getting-started"
        : `/${locale}/docs/guides/getting-started`,
    frontmatter: {
      kind: "guide",
      registryId: "guide.getting-started",
      messageNamespace: "local",
      assetNamespace: "local",
      tags: ["guides"],
      status: "published",
      updatedAt: "2026-06-20T00:00:00.000Z",
    },
    messages: {
      title: `Getting started (${locale})`,
      description: "desc",
    },
  };
}

describe("loadSearchDocumentsByLocale", () => {
  beforeEach(() => {
    resetSearchDocumentBuildCountForTests();
  });

  test("loads registry once and builds documents for each locale from shared indexes", async () => {
    let registryLoads = 0;
    const indexes = emptyIndexes();

    const documentsByLocale = await loadSearchDocumentsByLocale({
      locales: ["en", "ja"],
      loadRegistryFn: async () => {
        registryLoads += 1;
        return indexes;
      },
      loadPagesFn: async (locale) => [syntheticPage(locale)],
      loadBlogPostsFn: async () => [] as BlogSearchPostSource[],
    });

    expect(registryLoads).toBe(1);
    expect(getSearchDocumentBuildCountForTests()).toBe(2);
    expect(documentsByLocale.get("en")?.[0]?.title).toContain("en");
    expect(documentsByLocale.get("ja")?.[0]?.title).toContain("ja");
  });
});
