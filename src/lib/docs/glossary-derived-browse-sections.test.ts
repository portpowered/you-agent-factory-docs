import { describe, expect, test } from "bun:test";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildDocsBrowseSections,
  DOCS_BROWSE_SECTION_ORDER,
} from "@/lib/docs/browse-collection-sections";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import {
  buildGlossaryDerivedBrowseSections,
  conceptRecordBelongsToClassificationBranch,
} from "@/lib/docs/glossary-derived-browse-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";

/**
 * Glossary-derived Atlas browse helpers remain for sidebar decomposition until
 * that surface is cleaned. Public browse no longer composes those sections;
 * Atlas glossary page fixtures are gone from the factory content tree.
 */
describe("glossary derived browse sections", () => {
  test("resolves model-type and inference membership from canonical classification ids", () => {
    expect(
      conceptRecordBelongsToClassificationBranch(
        { primaryClassificationId: "classification.concept.model-type" },
        "classification.concept.model-type",
      ),
    ).toBe(true);
    expect(
      conceptRecordBelongsToClassificationBranch(
        { primaryClassificationId: "classification.concept.inference" },
        "classification.concept.inference",
      ),
    ).toBe(true);
    expect(
      conceptRecordBelongsToClassificationBranch(
        { primaryClassificationId: "classification.concept.math" },
        "classification.concept.model-type",
      ),
    ).toBe(false);
  });

  test("keeps the public browse hub on CLI collections without glossary-derived Atlas sections", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildDocsBrowseSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    expect(
      DOCS_BROWSE_SECTION_ORDER.map((sectionRef) => sectionRef.id),
    ).toEqual([...CLI_DOCS_COLLECTION_IDS]);
    expect(sections.map((section) => section.id)).toEqual([
      ...CLI_DOCS_COLLECTION_IDS,
    ]);
    for (const derivedId of [
      "model-types",
      "inference",
      "module-components",
      "glossary",
    ] as const) {
      expect(sections.some((section) => section.id === derivedId)).toBe(false);
    }
    for (const atlasTitle of [
      messages.browseIndex.modelTypesSectionTitle,
      messages.browseIndex.inferenceSectionTitle,
      "Module Components",
      messages.browseIndex.glossarySectionTitle,
    ] as const) {
      expect(sections.some((section) => section.title === atlasTitle)).toBe(
        false,
      );
    }
  });

  test("builds empty glossary-derived sections when no glossary pages ship", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildGlossaryDerivedBrowseSections({
      pages,
      locale: defaultLocale,
      messages,
    });

    expect(sections.map((section) => section.id)).toEqual([
      "model-types",
      "inference",
      "module-components",
    ]);
    for (const section of sections) {
      expect(section.entries).toEqual([]);
    }
  });
});
