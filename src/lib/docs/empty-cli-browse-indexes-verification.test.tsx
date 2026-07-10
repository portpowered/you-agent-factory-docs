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
 * Consolidated end-to-end proof for the factory CLI browse hub and four section
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

const REPRESENTATIVE_SECTION_PAGES = {
  guides: {
    title: "Getting Started",
    href: "/docs/guides/getting-started",
  },
  concepts: {
    title: "Harness",
    href: "/docs/concepts/harness",
  },
  techniques: {
    title: "Ralph",
    href: "/docs/techniques/ralph",
  },
  documentation: {
    title: "What is you-agent-factory",
    href: "/docs/documentation/what-is-you-agent-factory",
  },
} as const;

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

describe("factory CLI browse and section indexes end-to-end", () => {
  test("keeps default browse order on the four CLI collections with empty starters", () => {
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

  test("keeps authored customer page bundles under factory CLI collection roots", () => {
    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(
        listAuthoredPageBundleSlugs(join(DOCS_ROOT, collectionId)).length,
      ).toBeGreaterThan(0);
    }
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

  test("renders populated factory CLI section indexes without Atlas copy", async () => {
    const messages = await loadUiMessages();

    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      const indexMessages = sectionIndexMessages(messages, collectionId);
      const representative = REPRESENTATIVE_SECTION_PAGES[collectionId];
      const html = renderToStaticMarkup(
        await renderSectionCollectionIndexPage(collectionId),
      );

      expect(html).toContain(indexMessages.title);
      expect(html).toContain(indexMessages.description);
      expect(html).toContain(`aria-label="${indexMessages.listLabel}"`);
      expect(html).toContain(representative.title);
      expect(html).toContain(representative.href);
      expect(html).not.toContain(indexMessages.emptyTitle);

      expect(indexMessages.title).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(indexMessages.description).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(indexMessages.emptyTitle).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(indexMessages.emptyDescription).not.toMatch(ATLAS_PRODUCT_COPY);
      expect(indexMessages.emptyHomeLink).not.toMatch(ATLAS_PRODUCT_COPY);
    }
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
