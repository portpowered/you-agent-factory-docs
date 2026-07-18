/**
 * Regression coverage proving factory docs browse, section index, sidebar, and
 * search behavior stayed stable while the generic shell primitives and non-AI
 * fixture proof landed. Fixture routes must stay off public AI surfaces.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBrowseIndexPage,
  renderSectionKindIndexPage,
} from "@/app/(site)/site-renderers";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { DOCS_BROWSE_COLLECTION_IDS } from "@/lib/docs/browse-collection-sections";
import { DOCS_COLLECTION_IDS } from "@/lib/docs/collection-definition-contract";
import { collectSidebarPageLinks } from "@/lib/navigation/docs-sidebar-contract";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { source } from "@/lib/source";
import {
  listNonAiShellFixturePages,
  NON_AI_SHELL_FIXTURE_MESSAGES,
  NON_AI_SHELL_FIXTURE_URL_PREFIX,
} from "./fixture";

const AI_BROWSE_SECTION_LABELS = [
  "Guides",
  "Concepts",
  "Techniques",
  "Documentation",
] as const;

const AI_BROWSE_SECTION_INDEX_HREFS = [
  "/docs/guides",
  "/docs/concepts",
  "/docs/techniques",
  "/docs/documentation",
] as const;

const AI_BROWSE_HEADING_IDS = [
  "guides-heading",
  "concepts-heading",
  "techniques-heading",
  "documentation-heading",
] as const;

const CLI_SECTION_INDEX_CASES = [
  {
    kind: "guide" as const,
    title: "Guides",
    pageTitle: "Getting Started",
    pageHref: "/docs/guides/getting-started",
  },
  {
    kind: "concept" as const,
    title: "Concepts",
    pageTitle: "Harness",
    pageHref: "/docs/concepts/harness",
  },
  {
    kind: "technique" as const,
    title: "Techniques",
    pageTitle: "Ralph",
    pageHref: "/docs/techniques/ralph",
  },
  {
    kind: "documentation" as const,
    title: "Documentation",
    pageTitle: "What is you-agent-factory",
    pageHref: "/docs/documentation/what-is-you-agent-factory",
  },
] as const;

const RETIRED_ATLAS_URL_PREFIXES = [
  "/docs/models/",
  "/docs/modules/",
  "/docs/papers/",
  "/docs/training/",
  "/docs/systems/",
] as const;

function headingIdPosition(html: string, headingId: string): number {
  const position = html.indexOf(`id="${headingId}"`);
  expect(position).toBeGreaterThanOrEqual(0);
  return position;
}

describe("AI shell behavior parity after non-AI fixture proof", () => {
  describe("browse index", () => {
    test("keeps CLI collection section order and section index links", async () => {
      const html = renderToStaticMarkup(await renderBrowseIndexPage());

      for (const label of AI_BROWSE_SECTION_LABELS) {
        expect(html).toContain(label);
      }

      const headingPositions = AI_BROWSE_HEADING_IDS.map((headingId) =>
        headingIdPosition(html, headingId),
      );
      for (let index = 1; index < headingPositions.length; index += 1) {
        expect(headingPositions[index]).toBeGreaterThan(
          headingPositions[index - 1],
        );
      }

      for (const href of AI_BROWSE_SECTION_INDEX_HREFS) {
        expect(html).toContain(`href="${href}"`);
      }

      expect(DOCS_BROWSE_COLLECTION_IDS).toEqual([
        "guides",
        "concepts",
        "techniques",
        "documentation",
      ]);
      expect([...DOCS_COLLECTION_IDS]).toEqual([
        "guides",
        "concepts",
        "techniques",
        "documentation",
        "glossary",
        "references",
        "factories",
        "workers",
        "workstations",
      ]);
    });
  });

  describe("section indexes", () => {
    for (const section of CLI_SECTION_INDEX_CASES) {
      test(`renders populated ${section.title.toLowerCase()} index through the generic renderer`, async () => {
        const html = renderToStaticMarkup(
          await renderSectionKindIndexPage(section.kind),
        );

        expect(html).toContain(section.title);
        expect(html).toContain(section.pageTitle);
        expect(html).toContain(section.pageHref);
      });
    }
  });

  describe("sidebar page tree", () => {
    test("exposes factory page links and excludes retired Atlas destinations", () => {
      const links = collectSidebarPageLinks(source.pageTree);
      expect(links.length).toBeGreaterThan(0);
      expect(links.some((link) => link.url.startsWith("/docs/guides/"))).toBe(
        true,
      );
      expect(links.some((link) => link.url.startsWith("/docs/concepts/"))).toBe(
        true,
      );

      for (const prefix of RETIRED_ATLAS_URL_PREFIXES) {
        expect(links.some((link) => link.url.startsWith(prefix))).toBe(false);
      }
    });
  });

  describe("fixture isolation from public AI surfaces", () => {
    test("does not expose fixture routes through browse, sidebar, or search catalogs", async () => {
      const browseHtml = renderToStaticMarkup(await renderBrowseIndexPage());
      const sidebarUrls = collectSidebarPageLinks(source.pageTree).map(
        (link) => link.url,
      );
      const registry = await loadRegistry();
      const pages = await loadPublishedDocsPages("en");
      const searchUrls = buildSearchDocuments(pages, registry).map(
        (document) => document.url,
      );
      const fixtureUrls = listNonAiShellFixturePages().map((page) => page.url);

      expect(browseHtml).not.toContain(NON_AI_SHELL_FIXTURE_URL_PREFIX);
      expect(browseHtml).not.toContain(
        NON_AI_SHELL_FIXTURE_MESSAGES.browseIndex.guidesSectionTitle,
      );
      expect(browseHtml).not.toContain(
        NON_AI_SHELL_FIXTURE_MESSAGES.browseIndex.referenceSectionTitle,
      );

      for (const fixtureUrl of fixtureUrls) {
        expect(sidebarUrls).not.toContain(fixtureUrl);
        expect(searchUrls).not.toContain(fixtureUrl);
      }
    });
  });
});
