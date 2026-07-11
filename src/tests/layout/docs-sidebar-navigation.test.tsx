import { describe, expect, test } from "bun:test";
import {
  collectSidebarPageLinks,
  extractNdSidebarHtml,
  FAQ_DOCS_URL,
  findSidebarPageLink,
  GETTING_STARTED_GUIDE_URL,
  HARNESS_CONCEPT_URL,
  hasLegacyPlaceholderSidebar,
  INSTALL_DOCS_URL,
  PLACEHOLDER_SIDEBAR_DESCRIPTION,
  RALPH_TECHNIQUE_URL,
  stripHtmlScripts,
  TOKENS_CONCEPT_URL,
} from "@/lib/navigation/docs-sidebar-contract";
import { source } from "@/lib/source";
import { readBuiltHtmlForConvergenceTests } from "@/lib/verify/built-html-convergence-test-helpers";

const BUILT_HTML_DOC_ROUTES = [
  {
    path: "/docs/concepts/tokens",
    file: ".next/server/app/docs/concepts/tokens.html",
    requiredSidebarUrls: [TOKENS_CONCEPT_URL],
  },
  {
    path: "/docs/concepts/harness",
    file: ".next/server/app/docs/concepts/harness.html",
    requiredSidebarUrls: [HARNESS_CONCEPT_URL],
  },
  {
    path: "/docs/techniques/ralph",
    file: ".next/server/app/docs/techniques/ralph.html",
    requiredSidebarUrls: [RALPH_TECHNIQUE_URL],
  },
  {
    path: "/docs/guides/getting-started",
    file: ".next/server/app/docs/guides/getting-started.html",
    requiredSidebarUrls: [GETTING_STARTED_GUIDE_URL],
  },
  {
    path: "/docs/documentation/install",
    file: ".next/server/app/docs/documentation/install.html",
    requiredSidebarUrls: [INSTALL_DOCS_URL],
  },
] as const;

const BUILT_HTML_LOCALIZED_DOC_ROUTES = [
  {
    path: "/vi/docs/concepts/harness",
    file: ".next/server/app/vi/docs/concepts/harness.html",
    // Only assert links from the open Concepts folder. Collapsed Guides /
    // Techniques folders omit their children from static HTML even when the
    // localized page tree ships those routes.
    requiredSidebarUrls: [
      "/vi/docs/concepts/harness",
      "/vi/docs/concepts/tokens",
    ],
    // Folder button labels are locale-aware (vi common.json explorer.folders).
    requiredSidebarLabels: [">Hướng dẫn<", ">Khái niệm<", ">Kỹ thuật<"],
    forbiddenSidebarUrls: [
      "/vi/docs/modules/grouped-query-attention",
      "/vi/docs/modules/multi-head-attention",
    ],
    forbiddenSidebarLabels: [">Guides<", ">Concepts<", ">Techniques<"],
  },
] as const;

const BUILT_HTML_INDEX_ROUTES = [
  {
    path: "/docs/guides",
    file: ".next/server/app/docs/guides.html",
  },
  {
    path: "/docs/concepts",
    file: ".next/server/app/docs/concepts.html",
  },
] as const;

function readBuiltRouteHtml(relativePath: string): string | null {
  return readBuiltHtmlForConvergenceTests(relativePath);
}

describe("docs sidebar page-tree contract", () => {
  test("page tree includes factory guide, concept, and technique reader URLs", () => {
    const links = collectSidebarPageLinks(source.pageTree);
    const tokens = findSidebarPageLink(links, TOKENS_CONCEPT_URL);
    const harness = findSidebarPageLink(links, HARNESS_CONCEPT_URL);
    const ralph = findSidebarPageLink(links, RALPH_TECHNIQUE_URL);
    const gettingStarted = findSidebarPageLink(
      links,
      GETTING_STARTED_GUIDE_URL,
    );

    expect(tokens?.name).toBe("Tokens");
    expect(harness?.name).toBe("Harness");
    expect(ralph?.name).toBe("Ralph");
    expect(gettingStarted?.name).toBe("Getting Started");
  });

  test("page tree includes factory collection folder labels", () => {
    const sidebarJson = JSON.stringify(source.pageTree);

    expect(sidebarJson).toContain("Guides");
    expect(sidebarJson).toContain("Concepts");
    expect(sidebarJson).toContain("Techniques");
    expect(sidebarJson).toContain("Program documentation");
    expect(sidebarJson).toContain("You Agent Factory");
    expect(sidebarJson).toContain("Harnesses");
    expect(sidebarJson).toContain("Industrial engineering");
    expect(sidebarJson).toContain("Model inference");
    expect(sidebarJson).not.toContain("Reference Samples");
    expect(sidebarJson).not.toContain('"name":"Glossary"');
    expect(sidebarJson).not.toContain("Attention Foundations");
    expect(sidebarJson).not.toContain("Attention Variants");
  });

  test("page tree includes documentation install reader URL", () => {
    const links = collectSidebarPageLinks(source.pageTree);

    expect(findSidebarPageLink(links, INSTALL_DOCS_URL)?.name).toBe(
      "Install you-agent-factory",
    );
  });

  test("FAQ is a top-level explorer page outside Program documentation", () => {
    const links = collectSidebarPageLinks(source.pageTree);
    const topLevelFaq = source.pageTree.children.find(
      (node) =>
        node.type === "page" && "url" in node && node.url === FAQ_DOCS_URL,
    );
    const documentationFolder = source.pageTree.children.find(
      (node) => node.type === "folder" && node.name === "Program documentation",
    );

    expect(findSidebarPageLink(links, FAQ_DOCS_URL)).toEqual({
      name: "FAQ",
      url: FAQ_DOCS_URL,
    });
    expect(topLevelFaq).toEqual({
      type: "page",
      name: "FAQ",
      url: FAQ_DOCS_URL,
    });
    expect(source.pageTree.children.at(-1)).toEqual(topLevelFaq);
    if (documentationFolder?.type === "folder") {
      expect(
        collectSidebarPageLinks(documentationFolder.children).some(
          (link) => link.url === FAQ_DOCS_URL,
        ),
      ).toBe(false);
    }
  });
});

describe("docs sidebar navigation (built HTML)", () => {
  for (const route of BUILT_HTML_DOC_ROUTES) {
    test(`${route.path} renders populated Fumadocs sidebar links`, () => {
      const html = readBuiltRouteHtml(route.file);
      if (!html) {
        return;
      }

      const visibleHtml = stripHtmlScripts(html);
      const sidebar = extractNdSidebarHtml(visibleHtml);

      expect(sidebar.length).toBeGreaterThan(0);
      expect(visibleHtml).not.toContain(PLACEHOLDER_SIDEBAR_DESCRIPTION);
      expect(hasLegacyPlaceholderSidebar(visibleHtml)).toBe(false);
      for (const url of route.requiredSidebarUrls) {
        expect(sidebar).toContain(url);
      }
    });
  }

  for (const route of BUILT_HTML_INDEX_ROUTES) {
    test(`${route.path} renders Fumadocs sidebar folders instead of placeholder nav`, () => {
      const html = readBuiltRouteHtml(route.file);
      if (!html) {
        return;
      }

      const visibleHtml = stripHtmlScripts(html);
      const sidebar = extractNdSidebarHtml(visibleHtml);

      expect(sidebar.length).toBeGreaterThan(0);
      expect(sidebar).toContain(">Guides<");
      expect(sidebar).toContain(">Concepts<");
      expect(visibleHtml).not.toContain(PLACEHOLDER_SIDEBAR_DESCRIPTION);
      expect(hasLegacyPlaceholderSidebar(visibleHtml)).toBe(false);
    });
  }

  for (const route of BUILT_HTML_LOCALIZED_DOC_ROUTES) {
    test(`${route.path} omits broken localized docs links from the sidebar`, () => {
      const html = readBuiltRouteHtml(route.file);
      if (!html) {
        return;
      }

      const visibleHtml = stripHtmlScripts(html);
      const sidebar = extractNdSidebarHtml(visibleHtml);

      for (const url of route.requiredSidebarUrls) {
        expect(sidebar).toContain(url);
      }
      for (const label of route.requiredSidebarLabels) {
        expect(sidebar).toContain(label);
      }
      for (const url of route.forbiddenSidebarUrls) {
        expect(sidebar).not.toContain(url);
      }
      for (const label of route.forbiddenSidebarLabels ?? []) {
        expect(sidebar).not.toContain(label);
      }
    });
  }
});
