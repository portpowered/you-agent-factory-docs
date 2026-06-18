import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadDocPage,
  loadDocsShellNavigation,
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
} from "../../src/lib/content";

const CONTENT_ROOT = join(process.cwd(), "src/content");

describe("coder / reviewer pattern content pipeline", () => {
  test("keeps navigation, doc loading, localized search documents, and the public search artifact aligned", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);
    const page = loadDocPage("coder-reviewer-pattern", CONTENT_ROOT, {
      locale: "en",
    });
    const searchDocuments = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const searchArtifact = loadPublicSearchArtifact({
      contentRoot: CONTENT_ROOT,
    });

    const navPage = navigation.sections
      .find((section) => section.id === "guides")
      ?.pages.find(
        (projectedPage) =>
          projectedPage.canonicalId === "doc/coder-reviewer-pattern",
      );

    expect(navPage).toEqual({
      canonicalId: "doc/coder-reviewer-pattern",
      label: "Coder / Reviewer pattern",
      href: "/docs/coder-reviewer-pattern",
      order: 5,
      localeProjection: {
        canonicalPageId: "doc/coder-reviewer-pattern",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        availableLocales: ["en"],
        fellBackToCanonicalLocale: false,
      },
    });

    expect(page.record).toMatchObject({
      id: "doc/coder-reviewer-pattern",
      slug: "coder-reviewer-pattern",
      routePath: "/docs/coder-reviewer-pattern",
      canonicalLocale: "en",
      availableLocales: ["en"],
      section: "guides",
      order: 5,
      status: "published",
    });
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/coder-reviewer-pattern",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
    expect(page.body).toContain("approval is treated as a real gate");
    expect(page.body).toContain(
      "The most common failure mode is shallow review",
    );

    const searchDocument = searchDocuments.find(
      (document) => document.id === "doc/coder-reviewer-pattern@en",
    );
    expect(searchDocument).toMatchObject({
      id: "doc/coder-reviewer-pattern@en",
      canonicalId: "doc/coder-reviewer-pattern",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/coder-reviewer-pattern",
      title: "Coder / Reviewer pattern",
      section: "guides",
      searchPriority: 8,
    });
    expect(searchDocument?.headings).toContain("Where approval gates matter");
    expect(searchDocument?.headings).toContain(
      "Realistic limits and failure modes",
    );

    const searchEntry = searchArtifact.entries.find(
      (entry) => entry.id === "doc/coder-reviewer-pattern@en",
    );
    expect(searchEntry).toEqual(searchDocument);
  });
});
