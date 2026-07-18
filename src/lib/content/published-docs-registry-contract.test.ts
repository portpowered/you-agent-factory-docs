import { describe, expect, test } from "bun:test";
import { factoriesPageHref } from "@/lib/content/content-hrefs";
import type { DocsPageSource } from "@/lib/content/pages";
import {
  docsSectionFromSlug,
  PUBLISHED_DOCS_SECTIONS,
  type PublishedDocsEntry,
  publishedDocsHrefFromEntry,
  publishedDocsRelativeSlug,
} from "@/lib/content/published-docs-registry-contract";
import { buildPublishedDocsIndex } from "@/lib/content/published-docs-registry-source";

function factoriesPublishedEntry(
  overrides: Partial<PublishedDocsEntry> &
    Pick<PublishedDocsEntry, "docsSlug" | "slug" | "url">,
): PublishedDocsEntry {
  return {
    registryId: "documentation.factories-configuration",
    pageKind: "documentation",
    section: "factories",
    ...overrides,
  };
}

function syntheticDocsPage(options: {
  docsSlug: string;
  registryId: string;
  kind?: DocsPageSource["frontmatter"]["kind"];
}): DocsPageSource {
  const url = `/docs/${options.docsSlug}`;
  return {
    pageDir: `/tmp/${options.docsSlug}`,
    docsSlug: options.docsSlug,
    url,
    frontmatter: {
      kind: options.kind ?? "documentation",
      registryId: options.registryId,
      messageNamespace: "local",
      assetNamespace: "local",
      tags: [],
      status: "published",
      updatedAt: "2026-07-18",
    },
    messages: {
      title: "Synthetic",
      description: "Synthetic page for published-docs section proofs",
      sections: {},
      links: {},
    },
  };
}

describe("published docs registry contract — factories section", () => {
  test("accepts factories as a first-class published docs section", () => {
    expect(PUBLISHED_DOCS_SECTIONS).toContain("factories");
    expect(docsSectionFromSlug("factories/configuration")).toBe("factories");
    expect(docsSectionFromSlug("factories/docs/write-review")).toBe(
      "factories",
    );
  });

  test("rejects unsupported sections the same way as before", () => {
    expect(() => docsSectionFromSlug("modules/attention")).toThrow(
      /Unsupported published docs section "modules"/,
    );
    expect(() => docsSectionFromSlug("workers/agent")).toThrow(
      /Unsupported published docs section "workers"/,
    );
  });

  test("canonical factories hrefs resolve under /docs/factories, including nested slugs", () => {
    expect(factoriesPageHref("configuration")).toBe(
      "/docs/factories/configuration",
    );
    expect(factoriesPageHref("docs/write-review")).toBe(
      "/docs/factories/docs/write-review",
    );

    const flat = factoriesPublishedEntry({
      docsSlug: "factories/configuration",
      slug: "configuration",
      url: "/docs/factories/configuration",
    });
    expect(publishedDocsRelativeSlug(flat)).toBe("configuration");
    expect(publishedDocsHrefFromEntry(flat)).toBe(
      "/docs/factories/configuration",
    );

    const nested = factoriesPublishedEntry({
      registryId: "documentation.factories-docs-write-review",
      docsSlug: "factories/docs/write-review",
      slug: "write-review",
      url: "/docs/factories/docs/write-review",
    });
    expect(publishedDocsRelativeSlug(nested)).toBe("docs/write-review");
    expect(publishedDocsHrefFromEntry(nested)).toBe(
      "/docs/factories/docs/write-review",
    );
  });

  test("existing CLI published-docs href behavior stays on /docs/<section>/<slug>", () => {
    const cases: PublishedDocsEntry[] = [
      {
        registryId: "glossary.harness",
        slug: "harness",
        docsSlug: "glossary/harness",
        url: "/docs/glossary/harness",
        pageKind: "glossary",
        section: "glossary",
      },
      {
        registryId: "concept.harness",
        slug: "harness",
        docsSlug: "concepts/harness",
        url: "/docs/concepts/harness",
        pageKind: "concept",
        section: "concepts",
      },
      {
        registryId: "guide.getting-started",
        slug: "getting-started",
        docsSlug: "guides/getting-started",
        url: "/docs/guides/getting-started",
        pageKind: "guide",
        section: "guides",
      },
      {
        registryId: "technique.ralph",
        slug: "ralph",
        docsSlug: "techniques/ralph",
        url: "/docs/techniques/ralph",
        pageKind: "technique",
        section: "techniques",
      },
      {
        registryId: "documentation.configuration",
        slug: "configuration",
        docsSlug: "documentation/configuration",
        url: "/docs/documentation/configuration",
        pageKind: "documentation",
        section: "documentation",
      },
    ];

    for (const entry of cases) {
      expect(docsSectionFromSlug(entry.docsSlug)).toBe(entry.section);
      expect(publishedDocsHrefFromEntry(entry)).toBe(entry.url);
    }
  });

  test("scanning a factories page bundle derives section and matching canonical href", () => {
    const pages = [
      syntheticDocsPage({
        docsSlug: "factories/configuration",
        registryId: "documentation.factories-configuration",
      }),
      syntheticDocsPage({
        docsSlug: "factories/docs/write-review",
        registryId: "documentation.factories-docs-write-review",
      }),
    ];

    const index = buildPublishedDocsIndex(pages);
    expect(index.entries).toHaveLength(2);

    for (const entry of index.entries) {
      expect(entry.section).toBe("factories");
      expect(publishedDocsHrefFromEntry(entry)).toBe(entry.url);
      expect(entry.url.startsWith("/docs/factories/")).toBe(true);
      expect(entry.url.startsWith("/docs/documentation/")).toBe(false);
    }
  });
});
