import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { renderShellSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import {
  DOCS_ROOT,
  getDocsPageDir,
  REGISTRY_ROOT,
} from "@/lib/content/content-paths";
import { loadRegistry } from "@/lib/content/registry";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  CLI_DOCS_CONTENT_ROOT_SECTIONS,
  cliCollectionAllowsEmptyContent,
  EMPTY_CLI_REGISTRY_COLLECTION_DIRS,
  getCliDocsContentRoot,
  getEmptyCliRegistryCollectionRoot,
  isCliDocsContentRoot,
} from "@/lib/docs/cli-empty-content-roots";
import { getDocsCollectionDefinition } from "@/lib/docs/docs-collection-definitions";
import { CLI_DOCS_COLLECTION_IDS } from "@/lib/docs/docs-collection-slug-acceptance";
import { resolveDocsCollectionIndexMessages } from "@/lib/docs/section-collection-index";
import { defaultLocale } from "@/lib/i18n/locale-routing";

const EMPTY_CLI_INDEX_MESSAGE_KEYS = {
  guides: "guidesIndex",
  techniques: "techniquesIndex",
  documentation: "documentationIndex",
} as const;

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

function listAuthoredRegistryJsonFiles(collectionRoot: string): string[] {
  if (!existsSync(collectionRoot)) {
    return [];
  }

  return readdirSync(collectionRoot)
    .filter((entry) => entry.endsWith(".json"))
    .sort();
}

describe("CLI empty content roots", () => {
  test("designates the four CLI collection ids as content-root targets", () => {
    expect([...CLI_DOCS_CONTENT_ROOT_SECTIONS]).toEqual([
      ...CLI_DOCS_COLLECTION_IDS,
    ]);

    for (const id of CLI_DOCS_COLLECTION_IDS) {
      expect(isCliDocsContentRoot(id)).toBe(true);
      expect(cliCollectionAllowsEmptyContent(id)).toBe(true);
      expect(getCliDocsContentRoot(id)).toBe(join(DOCS_ROOT, id));
    }

    expect(isCliDocsContentRoot("models")).toBe(false);
    expect(isCliDocsContentRoot("modules")).toBe(false);
  });

  test("keeps guides and techniques docs roots empty of page bundles", () => {
    for (const id of ["guides", "techniques"] as const) {
      const root = getCliDocsContentRoot(id);
      expect(existsSync(root)).toBe(true);
      expect(listAuthoredPageBundleSlugs(root)).toEqual([]);
      expect(existsSync(getDocsPageDir(id, "placeholder-topic"))).toBe(false);
    }
  });

  test("keeps the documentation content root available for authored page bundles", () => {
    const root = getCliDocsContentRoot("documentation");
    expect(existsSync(root)).toBe(true);
    expect(cliCollectionAllowsEmptyContent("documentation")).toBe(true);
    expect(isCliDocsContentRoot("documentation")).toBe(true);
  });

  test("keeps empty CLI registry directories free of authored topic records", () => {
    expect([...EMPTY_CLI_REGISTRY_COLLECTION_DIRS]).toEqual([
      "guides",
      "techniques",
    ]);
    for (const collection of EMPTY_CLI_REGISTRY_COLLECTION_DIRS) {
      const root = getEmptyCliRegistryCollectionRoot(collection);
      expect(root).toBe(join(REGISTRY_ROOT, collection));
      expect(existsSync(root)).toBe(true);
      expect(listAuthoredRegistryJsonFiles(root)).toEqual([]);
    }
  });

  test("loadRegistry succeeds with empty guide/technique collections and documentation kind records", async () => {
    const indexes = await loadRegistry();

    for (const record of indexes.byId.values()) {
      expect(record.kind).not.toBe("guide");
      expect(record.kind).not.toBe("technique");
    }

    const documentationRecords = [...indexes.byId.values()].filter(
      (record) => record.kind === "documentation",
    );
    expect(documentationRecords.length).toBeGreaterThan(0);
  });

  test("section index empty state does not require starter pages for empty CLI collections", async () => {
    const messages = await loadUiMessages();

    for (const [collectionId, messageKey] of Object.entries(
      EMPTY_CLI_INDEX_MESSAGE_KEYS,
    ) as Array<[keyof typeof EMPTY_CLI_INDEX_MESSAGE_KEYS, string]>) {
      const definition = getDocsCollectionDefinition(collectionId);
      expect(definition.starterSlugs).toEqual([]);

      const sectionMessages = resolveDocsCollectionIndexMessages(
        messages,
        definition,
      );
      const indexCopy = messages[messageKey as keyof typeof messages] as {
        emptyTitle: string;
        emptyDescription: string;
        emptyHomeLink: string;
        listLabel: string;
      };

      const html = renderToStaticMarkup(
        renderShellSectionCollectionIndexPage({
          definition,
          pages: [],
          messages,
          locale: defaultLocale,
          emptyStateMessages: messages,
        }),
      );

      expect(html).toContain(sectionMessages.emptyTitle);
      expect(html).toContain(indexCopy.emptyTitle);
      expect(html).toContain(indexCopy.emptyDescription);
      expect(html).toContain(indexCopy.emptyHomeLink);
      expect(html).not.toContain(`aria-label="${indexCopy.listLabel}"`);
    }
  });
});
