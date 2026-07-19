import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBrowseIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";

const BROWSE_QUICK_ROUTE_HREFS = [
  "/search",
  "/docs/architecture",
  "/tags",
] as const;

const BROWSE_COLLECTION_SECTION_LABELS = [
  "Guides",
  "Concepts",
  "Techniques",
  "Documentation",
] as const;

const ATLAS_BROWSE_SECTION_HEADING_IDS = [
  "models-heading",
  "model-types-heading",
  "modules-heading",
  "module-components-heading",
  "inference-heading",
  "papers-heading",
  "training-heading",
  "systems-heading",
  "glossary-heading",
] as const;

const BROWSE_COLLECTION_SECTION_INDEX_HREFS = [
  "/docs/guides",
  "/docs/concepts",
  "/docs/techniques",
  "/docs/documentation",
] as const;

const BROWSE_COLLECTION_SECTION_HEADING_IDS = [
  "guides-heading",
  "concepts-heading",
  "techniques-heading",
  "documentation-heading",
] as const;

function hrefPosition(html: string, href: string): number {
  const position = html.indexOf(`href="${href}"`);
  expect(position).toBeGreaterThanOrEqual(0);
  return position;
}

function headingIdPosition(html: string, headingId: string): number {
  const position = html.indexOf(`id="${headingId}"`);
  expect(position).toBeGreaterThanOrEqual(0);
  return position;
}

const ATLAS_PRODUCT_COPY =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i;

const CLI_BROWSE_SECTION_MESSAGE_KEYS = [
  "guidesSectionTitle",
  "guidesSectionDescription",
  "guidesSectionLinkLabel",
  "conceptsSectionTitle",
  "conceptsSectionDescription",
  "conceptsSectionLinkLabel",
  "techniquesSectionTitle",
  "techniquesSectionDescription",
  "techniquesSectionLinkLabel",
  "documentationSectionTitle",
  "documentationSectionDescription",
  "documentationSectionLinkLabel",
] as const;

describe("browse index messages", () => {
  it("loads localized copy for the browse page", async () => {
    const messages = await loadUiMessages();
    expect(messages.browseIndex.title).toBe("Browse");
    expect(messages.browseIndex.description.length).toBeGreaterThan(0);
    expect(
      messages.browseIndex.guidesSectionDescription.length,
    ).toBeGreaterThan(0);
  });

  it("keeps browse hub and CLI section copy free of Model Atlas product phrasing", async () => {
    for (const locale of ["en", "ja", "vi", "zh-CN"] as const) {
      const messages = await loadUiMessages(locale);
      const { browseIndex } = messages;

      expect(browseIndex.title).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(browseIndex.description).not.toMatch(ATLAS_PRODUCT_COPY);

      for (const key of CLI_BROWSE_SECTION_MESSAGE_KEYS) {
        expect(browseIndex[key]).not.toMatch(ATLAS_PRODUCT_COPY);
      }
    }
  });

  it("does not ship retired Atlas collection browse message keys", async () => {
    for (const locale of ["en", "ja", "vi", "zh-CN"] as const) {
      const messages = await loadUiMessages(locale);
      const browseIndex = messages.browseIndex as Record<string, unknown>;

      for (const key of [
        "modelsSectionTitle",
        "modulesSectionTitle",
        "papersSectionTitle",
        "trainingSectionTitle",
        "systemsSectionTitle",
        "modelTypesSectionTitle",
        "inferenceSectionTitle",
        "moduleComponentsSectionTitle",
      ] as const) {
        expect(browseIndex[key]).toBeUndefined();
      }

      const topLevel = messages as Record<string, unknown>;
      for (const key of [
        "modelsIndex",
        "modulesIndex",
        "papersIndex",
        "trainingIndex",
        "systemsIndex",
      ] as const) {
        expect(topLevel[key]).toBeUndefined();
      }
    }
  });
});

describe("collection-driven browse behavior", () => {
  it("renders quick route hrefs before collection section content", async () => {
    const page = await renderBrowseIndexPage();
    const html = renderToStaticMarkup(page);
    const firstCollectionHrefPosition = hrefPosition(
      html,
      BROWSE_COLLECTION_SECTION_INDEX_HREFS[0],
    );

    for (const href of BROWSE_QUICK_ROUTE_HREFS) {
      expect(hrefPosition(html, href)).toBeLessThan(
        firstCollectionHrefPosition,
      );
    }
  });

  it("renders CLI collection section labels in browse order without Atlas sections", async () => {
    const page = await renderBrowseIndexPage();
    const html = renderToStaticMarkup(page);

    for (const label of BROWSE_COLLECTION_SECTION_LABELS) {
      expect(html).toContain(label);
    }
    for (const headingId of ATLAS_BROWSE_SECTION_HEADING_IDS) {
      expect(html).not.toContain(`id="${headingId}"`);
    }
    for (const atlasLabel of [
      "Model Types",
      "Inference",
      "Module Components",
      "Models",
      "Modules",
      "Papers",
      "Training",
      "Systems",
    ] as const) {
      expect(html).not.toContain(`>${atlasLabel}</h2>`);
    }

    const headingPositions = BROWSE_COLLECTION_SECTION_HEADING_IDS.map(
      (headingId) => headingIdPosition(html, headingId),
    );

    for (let index = 1; index < headingPositions.length; index += 1) {
      expect(headingPositions[index]).toBeGreaterThan(
        headingPositions[index - 1],
      );
    }
  });

  it("renders view-all links to matching CLI section index routes", async () => {
    const page = await renderBrowseIndexPage();
    const html = renderToStaticMarkup(page);

    for (const href of BROWSE_COLLECTION_SECTION_INDEX_HREFS) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it("renders localized quick routes and CLI section index hrefs for shipped locales", async () => {
    const page = await renderBrowseIndexPage("vi");
    const html = renderToStaticMarkup(page);
    const localizedSectionPosition = hrefPosition(html, "/vi/docs/guides");

    for (const href of ["/vi/search", "/vi/tags"] as const) {
      expect(hrefPosition(html, href)).toBeLessThan(localizedSectionPosition);
    }
    expect(html).not.toContain('href="/vi/docs/glossary"');

    expect(html).toContain('href="/vi/docs/guides"');
    expect(html).toContain('href="/vi/docs/concepts"');
    expect(html).toContain('href="/vi/docs/techniques"');
    expect(html).toContain('href="/vi/docs/documentation"');
  });
});

describe("browse index page render", () => {
  it("renders quick routes and CLI collection sections without Atlas starters", async () => {
    const page = await renderBrowseIndexPage();
    const html = renderToStaticMarkup(page);

    for (const href of [
      "/search",
      "/docs/architecture",
      "/tags",
      "/docs/guides",
      "/docs/concepts",
      "/docs/techniques",
      "/docs/documentation",
    ] as const) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="/docs/glossary"');

    for (const label of [
      "Quick routes",
      "Guides",
      "Concepts",
      "Techniques",
      "Documentation",
    ] as const) {
      expect(html).toContain(label);
    }

    for (const headingId of ATLAS_BROWSE_SECTION_HEADING_IDS) {
      expect(html).not.toContain(`id="${headingId}"`);
    }

    expect(html).toContain("list-none");
    expect(html).not.toContain("list-disc");
  });

  it("renders localized vietnamese browse routes and CLI section indexes", async () => {
    const page = await renderBrowseIndexPage("vi");
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Duyệt");
    expect(html).not.toContain("Duyệt Atlas");
    expect(html).toContain('href="/vi/search"');
    expect(html).not.toContain('href="/vi/docs/glossary"');
    expect(html).toContain('href="/vi/tags"');
    expect(html).toContain('href="/vi/docs/guides"');
    expect(html).toContain('href="/vi/docs/documentation"');
  });
});
