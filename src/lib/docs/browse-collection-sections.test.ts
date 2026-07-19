import { describe, expect, test } from "bun:test";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildBrowseCollectionSections,
  buildDocsBrowseSections,
  DOCS_BROWSE_COLLECTION_IDS,
  DOCS_BROWSE_SECTION_ORDER,
} from "@/lib/docs/browse-collection-sections";
import { getDocsCollectionDefinition } from "@/lib/docs/docs-collection-definitions";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import { buildLocalizedRoute, defaultLocale } from "@/lib/i18n/locale-routing";

const ATLAS_BROWSE_SECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
  "glossary",
] as const;

describe("browse collection sections", () => {
  test("defaults browse collection order to the four CLI collections", () => {
    expect(DOCS_BROWSE_COLLECTION_IDS).toEqual([...CLI_DOCS_COLLECTION_IDS]);
    expect(
      DOCS_BROWSE_SECTION_ORDER.map((sectionRef) => sectionRef.id),
    ).toEqual([...CLI_DOCS_COLLECTION_IDS]);
  });

  test("builds sections in the CLI browse order from collection definitions", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildBrowseCollectionSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    expect(sections.map((section) => section.id)).toEqual([
      ...DOCS_BROWSE_COLLECTION_IDS,
    ]);
    expect(sections.map((section) => section.title)).toEqual([
      messages.browseIndex.guidesSectionTitle,
      messages.browseIndex.conceptsSectionTitle,
      messages.browseIndex.techniquesSectionTitle,
      messages.browseIndex.documentationSectionTitle,
    ]);
    for (const atlasId of ATLAS_BROWSE_SECTION_IDS) {
      expect(sections.some((section) => section.id === atlasId)).toBe(false);
    }
  });

  test("buildDocsBrowseSections matches the CLI section order without Atlas headings", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildDocsBrowseSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    expect(sections.map((section) => section.id)).toEqual([
      ...CLI_DOCS_COLLECTION_IDS,
    ]);
    expect(sections.map((section) => section.title)).toEqual([
      messages.browseIndex.guidesSectionTitle,
      messages.browseIndex.conceptsSectionTitle,
      messages.browseIndex.techniquesSectionTitle,
      messages.browseIndex.documentationSectionTitle,
    ]);
    for (const atlasTitle of [
      "Models",
      "Modules",
      "Papers",
      "Training",
      "Systems",
      "Glossary",
      "Model Types",
      "Inference",
      "Module Components",
    ] as const) {
      expect(sections.some((section) => section.title === atlasTitle)).toBe(
        false,
      );
    }
    for (const derivedId of [
      "model-types",
      "inference",
      "module-components",
    ] as const) {
      expect(sections.some((section) => section.id === derivedId)).toBe(false);
    }
  });

  test("keeps empty CLI starter lists while browse sections can still list published pages", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildBrowseCollectionSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(getDocsCollectionDefinition(collectionId).starterSlugs).toEqual(
        [],
      );
    }

    expect(
      sections.find((section) => section.id === "guides")?.entries.length,
    ).toBeGreaterThan(0);
    expect(
      sections.find((section) => section.id === "concepts")?.entries.length,
    ).toBeGreaterThan(0);
  });

  test("resolves browse link hrefs to matching CLI section index routes", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildBrowseCollectionSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(
        sections.find((section) => section.id === collectionId)?.linkHref,
      ).toBe(
        buildLocalizedRoute(
          { surface: "docs-page", slug: collectionId },
          defaultLocale,
        ),
      );
    }
  });

  test("resolves localized browse link hrefs for CLI section indexes", async () => {
    const messages = await loadUiMessages("vi");
    const pages = await loadShippedLocalizedDocsPages("vi");
    const sections = buildBrowseCollectionSections({
      pages,
      locale: "vi",
      messages,
    });

    expect(sections.find((section) => section.id === "guides")?.linkHref).toBe(
      buildLocalizedRoute({ surface: "docs-page", slug: "guides" }, "vi"),
    );
    expect(
      sections.find((section) => section.id === "documentation")?.linkHref,
    ).toBe(
      buildLocalizedRoute(
        { surface: "docs-page", slug: "documentation" },
        "vi",
      ),
    );
  });

  test("resolves browse message keys for section descriptions and link labels", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildBrowseCollectionSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    const conceptsSection = sections.find(
      (section) => section.id === "concepts",
    );
    expect(conceptsSection?.description).toBe(
      messages.browseIndex.conceptsSectionDescription,
    );
    expect(conceptsSection?.linkLabel).toBe(
      messages.browseIndex.conceptsSectionLinkLabel,
    );

    const guidesSection = sections.find((section) => section.id === "guides");
    expect(guidesSection?.description).toBe(
      messages.browseIndex.guidesSectionDescription,
    );
    expect(guidesSection?.linkLabel).toBe(
      messages.browseIndex.guidesSectionLinkLabel,
    );
  });
});
