/**
 * R02 story 005: prove focused inventory, search, sitemap, and link surfaces
 * stay aligned for Concepts + Program documentation pages on the combined tip.
 * Updated for W18 move-stub demotion (repair-moved-duplicate-doc-stubs-005):
 * demoted stubs stay in the link inventory as published compatibility routes
 * but are absent from ordinary search/sitemap discovery.
 *
 * Suite paths live in
 * docs/internal/processes/repair-convergence-verification-relevant-files.md.
 */
import { describe, expect, test } from "bun:test";
import { collectDocumentationLinkFiles } from "@/lib/build/validate-links";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";

const R02_CONCEPTS_URLS = [
  "/docs/concepts/skills",
  "/docs/concepts/mcp",
  "/docs/concepts/tool-calling",
  "/docs/concepts/tokens",
] as const;

/** Ordinary Program documentation discovery destinations after stub demotion. */
const R02_DISCOVERABLE_PROGRAM_DOC_URLS = [
  "/docs/documentation/throttling-and-limits",
  "/docs/documentation/packaged-documents",
  "/docs/documentation/packaged-factories",
] as const;

/** Published W18 move stubs kept for compatibility HTML only. */
const R02_DEMOTED_PROGRAM_DOC_STUB_URLS = [
  "/docs/documentation/mock-workers",
  "/docs/documentation/script-workers",
  "/docs/documentation/poller-workers",
  "/docs/documentation/agent-workers",
  "/docs/documentation/inference-workers",
] as const;

const R02_PROGRAM_DOC_URLS = [
  ...R02_DISCOVERABLE_PROGRAM_DOC_URLS,
  ...R02_DEMOTED_PROGRAM_DOC_STUB_URLS,
] as const;

describe("focused repair suites R02 convergence", () => {
  test("link inventory includes Concepts and eight Program documentation URLs once", async () => {
    const files = await collectDocumentationLinkFiles();
    const urls = new Set(files.map((file) => file.url));
    const paths = files.map((file) => file.path);

    for (const url of R02_CONCEPTS_URLS) {
      expect(urls.has(url)).toBe(true);
    }
    for (const url of R02_PROGRAM_DOC_URLS) {
      expect(urls.has(url)).toBe(true);
    }
    expect(urls.has("/docs/guides/getting-started")).toBe(true);
    expect(urls.has("/docs/glossary/token")).toBe(false);
    expect(urls.has("/docs/modules/grouped-query-attention")).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("search documents index Concepts and non-stub Program documentation pages", async () => {
    const indexes = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const byUrl = new Map(
      buildSearchDocuments(pages, indexes).map((document) => [
        document.url,
        document,
      ]),
    );

    for (const url of R02_CONCEPTS_URLS) {
      expect(byUrl.get(url)?.kind).toBe("concept");
    }
    for (const url of R02_DISCOVERABLE_PROGRAM_DOC_URLS) {
      expect(byUrl.get(url)?.kind).toBe("documentation");
    }
    for (const url of R02_DEMOTED_PROGRAM_DOC_STUB_URLS) {
      expect(byUrl.has(url)).toBe(false);
    }
  });

  test("public sitemap lists Concepts and non-stub Program documentation pages", () => {
    const routes = new Set(listPublicSitemapRoutes());

    for (const url of [
      ...R02_CONCEPTS_URLS,
      ...R02_DISCOVERABLE_PROGRAM_DOC_URLS,
    ]) {
      expect(routes.has(url)).toBe(true);
    }
    for (const url of R02_DEMOTED_PROGRAM_DOC_STUB_URLS) {
      expect(routes.has(url)).toBe(false);
    }
  });
});
