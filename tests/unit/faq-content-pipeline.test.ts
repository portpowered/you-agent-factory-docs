import { describe, expect, test } from "bun:test";
import {
  loadDocPage,
  loadDocsShellNavigation,
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
} from "../../src/lib/content";

const CONTENT_ROOT = `${process.cwd()}/src/content`;

describe("FAQ content pipeline verification", () => {
  test("keeps the FAQ page aligned across doc loading, generated navigation, and search metadata", () => {
    const page = loadDocPage("faq", CONTENT_ROOT, { locale: "en" });
    const navigation = loadDocsShellNavigation(CONTENT_ROOT, { locale: "en" });
    const searchDocuments = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    expect(page.record).toMatchObject({
      id: "doc/faq",
      kind: "doc",
      slug: "faq",
      routePath: "/docs/faq",
      canonicalLocale: "en",
      availableLocales: ["en"],
      section: "guides",
      searchInclude: true,
      searchPriority: 8,
      status: "published",
    });
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/faq",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });

    const guidesSection = navigation.sections.find(
      (section) => section.id === "guides",
    );
    expect(guidesSection).toMatchObject({
      id: "guides",
      label: "Guides",
    });
    expect(guidesSection?.pages).toContainEqual(
      expect.objectContaining({
        canonicalId: "doc/faq",
        label: "FAQ",
        href: "/docs/faq",
        order: 3,
      }),
    );

    const searchDocument = searchDocuments.find(
      (document) => document.id === "doc/faq@en",
    );
    expect(searchDocument).toMatchObject({
      id: "doc/faq@en",
      canonicalId: "doc/faq",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/faq",
      title: "FAQ",
      section: "guides",
      searchPriority: 8,
      tags: ["docs", "faq"],
    });
    expect(searchDocument?.headings).toContain(
      "What should I expect from logs?",
    );
    expect(searchDocument?.body).toContain(
      "it does not guarantee correctness and it should not be treated as a replacement for human judgment",
    );

    const artifactEntry = artifact.entries.find(
      (entry) => entry.id === "doc/faq@en",
    );
    expect(artifactEntry).toEqual({
      id: "doc/faq@en",
      canonicalId: "doc/faq",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/faq",
      title: "FAQ",
      description: "",
      headings: searchDocument?.headings ?? [],
      body: searchDocument?.body ?? "",
      tags: ["docs", "faq"],
      section: "guides",
      searchPriority: 8,
    });
  });
});
