import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadDocPage,
  loadDocsShellNavigation,
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
} from "../../src/lib/content";

const CONTENT_ROOT = join(process.cwd(), "src/content");

describe("mcp installation content pipeline", () => {
  test("keeps navigation, doc loading, localized search documents, and the public search artifact aligned", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);
    const page = loadDocPage("mcp-installation", CONTENT_ROOT, {
      locale: "en",
    });
    const searchDocuments = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const searchArtifact = loadPublicSearchArtifact({
      contentRoot: CONTENT_ROOT,
    });

    const navPage = navigation.sections
      .find((section) => section.id === "guides")
      ?.pages.find(
        (projectedPage) => projectedPage.canonicalId === "doc/mcp-installation",
      );

    expect(navPage).toEqual({
      canonicalId: "doc/mcp-installation",
      label: "MCP installation",
      href: "/docs/mcp-installation",
      order: 4,
      localeProjection: {
        canonicalPageId: "doc/mcp-installation",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        availableLocales: ["en"],
        fellBackToCanonicalLocale: false,
      },
    });

    expect(page.record).toMatchObject({
      id: "doc/mcp-installation",
      slug: "mcp-installation",
      routePath: "/docs/mcp-installation",
      canonicalLocale: "en",
      availableLocales: ["en"],
      section: "guides",
      order: 4,
      status: "published",
    });
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/mcp-installation",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
    expect(page.body).toContain("Model Context Protocol (MCP)");
    expect(page.body).toContain(
      "it belongs with the generated guides rather than inside the setup-only sequence",
    );

    const searchDocument = searchDocuments.find(
      (document) => document.id === "doc/mcp-installation@en",
    );
    expect(searchDocument).toMatchObject({
      id: "doc/mcp-installation@en",
      canonicalId: "doc/mcp-installation",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/mcp-installation",
      title: "MCP installation",
      section: "guides",
      searchPriority: 8,
    });
    expect(searchDocument?.headings).toContain("Where this guide fits");
    expect(searchDocument?.headings).toContain(
      "When to stay on the simpler path",
    );

    const searchEntry = searchArtifact.entries.find(
      (entry) => entry.id === "doc/mcp-installation@en",
    );
    expect(searchEntry).toEqual(searchDocument);
  });
});
