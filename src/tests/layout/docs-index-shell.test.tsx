import { describe, expect, test } from "bun:test";
import {
  extractNdSidebarHtml,
  GETTING_STARTED_GUIDE_URL,
  hasLegacyPlaceholderSidebar,
  PLACEHOLDER_SIDEBAR_DESCRIPTION,
  stripHtmlScripts,
  TOKENS_CONCEPT_URL,
} from "@/lib/navigation/docs-sidebar-contract";
import { readBuiltHtmlForConvergenceTests } from "@/lib/verify/built-html-convergence-test-helpers";

const BUILT_HTML_INDEX_ROUTES = [
  {
    path: "/docs/guides",
    file: ".next/server/app/docs/guides.html",
    title: "Guides",
    entryHref: GETTING_STARTED_GUIDE_URL,
  },
  {
    path: "/docs/concepts",
    file: ".next/server/app/docs/concepts.html",
    title: "Concepts",
    entryHref: TOKENS_CONCEPT_URL,
  },
] as const;

function readBuiltRouteHtml(relativePath: string): string | null {
  return readBuiltHtmlForConvergenceTests(relativePath);
}

describe("docs index routes unified shell (built HTML)", () => {
  for (const route of BUILT_HTML_INDEX_ROUTES) {
    test(`${route.path} shares canonical shell chrome and index article content`, () => {
      const html = readBuiltRouteHtml(route.file);
      if (!html) {
        return;
      }

      const visibleHtml = stripHtmlScripts(html);
      const sidebar = extractNdSidebarHtml(visibleHtml);

      expect(visibleHtml).toContain('aria-label="Primary"');
      expect(visibleHtml).toContain('id="nd-sidebar"');
      expect(visibleHtml).toContain('id="nd-page"');
      expect(sidebar.length).toBeGreaterThan(0);
      expect(sidebar).toContain(">Guides<");
      expect(sidebar).toContain(">Concepts<");
      expect(visibleHtml).toContain(route.entryHref);
      expect(visibleHtml).not.toContain(PLACEHOLDER_SIDEBAR_DESCRIPTION);
      expect(hasLegacyPlaceholderSidebar(visibleHtml)).toBe(false);
      expect(visibleHtml).toContain(route.title);
    });
  }
});
