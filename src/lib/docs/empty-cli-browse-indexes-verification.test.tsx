import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBrowseIndexPage,
  renderSectionCollectionIndexPage,
} from "@/app/(site)/site-renderers";
import { DOCS_ROOT } from "@/lib/content/content-paths";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import {
  DOCS_BROWSE_COLLECTION_IDS,
  DOCS_BROWSE_SECTION_ORDER,
} from "@/lib/docs/browse-collection-sections";
import { getDocsCollectionDefinition } from "@/lib/docs/docs-collection-definitions";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";

/**
 * Consolidated end-to-end proof for the empty CLI browse hub and four section
 * indexes. Run directly (`bun test src/lib/docs/empty-cli-browse-indexes-verification.test.tsx`)
 * — `src/lib/docs/` is excluded from required `bun run test` after Atlas deletion.
 */

const ATLAS_PRODUCT_COPY =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i;

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

const CLI_SECTION_INDEX_MESSAGE_KEYS = {
  guides: "guidesIndex",
  concepts: "conceptsIndex",
  techniques: "techniquesIndex",
  documentation: "documentationIndex",
} as const satisfies Record<
  (typeof CLI_DOCS_COLLECTION_IDS)[number],
  keyof UiMessages
>;

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

type CliSectionIndexMessages = UiMessages["guidesIndex"];

function listAuthoredPageBundleSlugs(sectionRoot: string): string[] {
  if (!existsSync(sectionRoot)) {
    return [];
  }

  return readdirSync(sectionRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(sectionRoot, entry.name, "page.mdx")))
    .map((entry) => entry.name)
    .sort();
}

function sectionIndexMessages(
  messages: UiMessages,
  collectionId: (typeof CLI_DOCS_COLLECTION_IDS)[number],
): CliSectionIndexMessages {
  return messages[
    CLI_SECTION_INDEX_MESSAGE_KEYS[collectionId]
  ] as CliSectionIndexMessages;
}

describe("empty CLI browse and section indexes end-to-end", () => {
  test("keeps default browse order on the four empty CLI collections", () => {
    expect([...DOCS_BROWSE_COLLECTION_IDS]).toEqual([
      ...CLI_DOCS_COLLECTION_IDS,
    ]);
    expect(
      DOCS_BROWSE_SECTION_ORDER.map((sectionRef) => sectionRef.id),
    ).toEqual([...CLI_DOCS_COLLECTION_IDS]);

    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(getDocsCollectionDefinition(collectionId).starterSlugs).toEqual(
        [],
      );
    }
  });

  test("keeps techniques free of authored customer page bundles", () => {
    expect(listAuthoredPageBundleSlugs(join(DOCS_ROOT, "techniques"))).toEqual(
      [],
    );
  });

  test("lists authored guide and concept page bundles under their collection roots", () => {
    expect(listAuthoredPageBundleSlugs(join(DOCS_ROOT, "guides"))).toContain(
      "getting-started",
    );
    expect(listAuthoredPageBundleSlugs(join(DOCS_ROOT, "concepts"))).toEqual([
      "tokens",
    ]);
  });

  test("keeps the documentation collection root available for authored page bundles", () => {
    expect(existsSync(join(DOCS_ROOT, "documentation"))).toBe(true);
  });

  test("renders the browse hub with CLI section headings and no Atlas sections", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(await renderBrowseIndexPage());

    expect(html).toContain(messages.browseIndex.title);
    expect(html).toContain(messages.browseIndex.description);
    expect(messages.browseIndex.title).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(messages.browseIndex.description).not.toMatch(ATLAS_PRODUCT_COPY);

    for (const key of CLI_BROWSE_SECTION_MESSAGE_KEYS) {
      expect(messages.browseIndex[key]).not.toMatch(ATLAS_PRODUCT_COPY);
    }

    const headingPositions = CLI_DOCS_COLLECTION_IDS.map((collectionId) => {
      const headingId = `${collectionId}-heading`;
      const position = html.indexOf(`id="${headingId}"`);
      expect(position).toBeGreaterThanOrEqual(0);
      expect(html).toContain(`href="/docs/${collectionId}"`);
      return position;
    });

    for (let index = 1; index < headingPositions.length; index += 1) {
      expect(headingPositions[index]).toBeGreaterThan(
        headingPositions[index - 1],
      );
    }

    for (const headingId of ATLAS_BROWSE_SECTION_HEADING_IDS) {
      expect(html).not.toContain(`id="${headingId}"`);
    }
  });

  test("renders empty techniques index and populated guides, concepts, and documentation indexes without Atlas copy", async () => {
    const messages = await loadUiMessages();

    const techniquesMessages = sectionIndexMessages(messages, "techniques");
    const techniquesHtml = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("techniques"),
    );

    expect(techniquesHtml).toContain(techniquesMessages.title);
    expect(techniquesHtml).toContain(techniquesMessages.description);
    expect(techniquesHtml).toContain(techniquesMessages.emptyTitle);
    expect(techniquesHtml).toContain(techniquesMessages.emptyDescription);
    expect(techniquesHtml).toContain(techniquesMessages.emptyHomeLink);
    expect(techniquesHtml).toContain('href="/"');
    expect(techniquesHtml).not.toContain(
      `aria-label="${techniquesMessages.listLabel}"`,
    );
    expect(techniquesMessages.title).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(techniquesMessages.description).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(techniquesMessages.emptyTitle).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(techniquesMessages.emptyDescription).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(techniquesMessages.emptyHomeLink).not.toMatch(ATLAS_PRODUCT_COPY);

    const guidesMessages = sectionIndexMessages(messages, "guides");
    const guidesHtml = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("guides"),
    );
    expect(guidesHtml).toContain(guidesMessages.title);
    expect(guidesHtml).toContain(`aria-label="${guidesMessages.listLabel}"`);
    expect(guidesHtml).toContain("Getting Started");
    expect(guidesHtml).toContain("/docs/guides/getting-started");
    expect(guidesHtml).not.toContain(guidesMessages.emptyTitle);

    const conceptsMessages = sectionIndexMessages(messages, "concepts");
    const conceptsHtml = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("concepts"),
    );
    expect(conceptsHtml).toContain(conceptsMessages.title);
    expect(conceptsHtml).toContain(
      `aria-label="${conceptsMessages.listLabel}"`,
    );
    expect(conceptsHtml).toContain("Tokens");
    expect(conceptsHtml).toContain("/docs/concepts/tokens");
    expect(conceptsHtml).toContain(
      "Factory and work tokens: the unit of submitted work that occupies a work-type state as it moves through you-agent-factory.",
    );
    expect(conceptsHtml).not.toContain(conceptsMessages.emptyTitle);

    const documentationMessages = sectionIndexMessages(
      messages,
      "documentation",
    );
    const documentationHtml = renderToStaticMarkup(
      await renderSectionCollectionIndexPage("documentation"),
    );

    expect(documentationHtml).toContain(documentationMessages.title);
    expect(documentationHtml).toContain(documentationMessages.description);
    expect(documentationHtml).toContain(
      `aria-label="${documentationMessages.listLabel}"`,
    );
    expect(documentationHtml).toContain("What is you-agent-factory");
    expect(documentationHtml).toContain(
      "/docs/documentation/what-is-you-agent-factory",
    );
    expect(documentationHtml).toContain(
      "you-agent-factory is a CLI and agent-factory workflow system that keeps long-running agent work persistent.",
    );
    expect(documentationHtml).not.toContain(documentationMessages.emptyTitle);
    expect(documentationMessages.title).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(documentationMessages.description).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(documentationMessages.emptyTitle).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(documentationMessages.emptyDescription).not.toMatch(
      ATLAS_PRODUCT_COPY,
    );
    expect(documentationMessages.emptyHomeLink).not.toMatch(ATLAS_PRODUCT_COPY);
  });

  test("keeps localized browse hub and CLI empty-state message fields Atlas-free", async () => {
    for (const locale of ["en", "ja", "vi", "zh-CN"] as const) {
      const messages = await loadUiMessages(locale);

      expect(messages.browseIndex.title).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(messages.browseIndex.description).not.toMatch(ATLAS_PRODUCT_COPY);

      for (const key of CLI_BROWSE_SECTION_MESSAGE_KEYS) {
        expect(messages.browseIndex[key]).not.toMatch(ATLAS_PRODUCT_COPY);
      }

      for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
        const indexMessages = sectionIndexMessages(messages, collectionId);
        expect(indexMessages.emptyTitle).not.toMatch(ATLAS_PRODUCT_COPY);
        expect(indexMessages.emptyDescription).not.toMatch(ATLAS_PRODUCT_COPY);
        expect(indexMessages.emptyHomeLink).not.toMatch(ATLAS_PRODUCT_COPY);
      }
    }
  });
});
