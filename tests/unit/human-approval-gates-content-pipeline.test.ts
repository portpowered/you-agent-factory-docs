import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadDocPage,
  loadDocsShellNavigation,
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
} from "../../src/lib/content";

const CONTENT_ROOT = join(process.cwd(), "src/content");

describe("human approval gates content pipeline", () => {
  test("keeps navigation, doc loading, localized search documents, and the public search artifact aligned", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);
    const page = loadDocPage("human-approval-gates", CONTENT_ROOT, {
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
          projectedPage.canonicalId === "doc/human-approval-gates",
      );

    expect(navPage).toEqual({
      canonicalId: "doc/human-approval-gates",
      label: "Human approval gates",
      href: "/docs/human-approval-gates",
      order: 5,
      localeProjection: {
        canonicalPageId: "doc/human-approval-gates",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        availableLocales: ["en"],
        fellBackToCanonicalLocale: false,
      },
    });

    expect(page.record).toMatchObject({
      id: "doc/human-approval-gates",
      slug: "human-approval-gates",
      routePath: "/docs/human-approval-gates",
      canonicalLocale: "en",
      availableLocales: ["en"],
      section: "guides",
      order: 5,
      status: "published",
    });
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/human-approval-gates",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
    expect(page.body).toContain(
      "An approval gate should interrupt execution at a meaningful risk boundary, not at every trivial handoff.",
    );
    expect(page.body).toContain(
      "Treat an approval as an evidence check, not a gut check.",
    );
    expect(page.body).toContain(
      "Approval loops improve the odds of safe operation, but they do not guarantee correctness.",
    );

    const searchDocument = searchDocuments.find(
      (document) => document.id === "doc/human-approval-gates@en",
    );
    expect(searchDocument).toMatchObject({
      id: "doc/human-approval-gates@en",
      canonicalId: "doc/human-approval-gates",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/human-approval-gates",
      title: "Human approval gates",
      section: "guides",
      searchPriority: 8,
    });
    expect(searchDocument?.headings).toContain(
      "When a workflow should pause for review",
    );
    expect(searchDocument?.headings).toContain(
      "What reviewers should inspect before approving",
    );
    expect(searchDocument?.headings).toContain(
      "Why approval loops improve safe adoption",
    );

    const searchEntry = searchArtifact.entries.find(
      (entry) => entry.id === "doc/human-approval-gates@en",
    );
    expect(searchEntry).toEqual(searchDocument);
  });
});
