import { describe, expect, test } from "bun:test";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { CLI_DOCS_CONTENT_ROOT_SECTIONS } from "@/lib/docs/cli-empty-content-roots";
import {
  DOCS_COLLECTION_IDS,
  DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS,
  type DocsCollectionMessageKeys,
} from "@/lib/docs/collection-definition-contract";
import {
  assertDocsCollectionInventory,
  DOCS_COLLECTION_DEFINITIONS,
  getDocsCollectionDefinition,
  listDocsCollectionDefinitions,
} from "@/lib/docs/docs-collection-definitions";

const EMPTY_CLI_COLLECTION_IDS = CLI_DOCS_CONTENT_ROOT_SECTIONS;

function resolveUiMessagePath(messages: UiMessages, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>(
      (current, segment) =>
        current !== null &&
        typeof current === "object" &&
        segment in (current as Record<string, unknown>)
          ? (current as Record<string, unknown>)[segment]
          : undefined,
      messages,
    );

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing UI message for path: ${path}`);
  }

  return value;
}

function expectResolvableMessageKeys(
  messages: UiMessages,
  messageKeys: DocsCollectionMessageKeys,
): void {
  for (const path of [
    messageKeys.browse.sectionTitle,
    messageKeys.browse.sectionDescription,
    messageKeys.browse.sectionLinkLabel,
    messageKeys.index.title,
    messageKeys.index.description,
    messageKeys.index.listLabel,
    messageKeys.index.emptyTitle,
    messageKeys.index.emptyDescription,
    messageKeys.index.emptyHomeLink,
  ]) {
    expect(resolveUiMessagePath(messages, path).length).toBeGreaterThan(0);
  }
}

describe("docs collection definitions config", () => {
  test("represents every current docs collection exactly once", () => {
    assertDocsCollectionInventory();

    expect(
      DOCS_COLLECTION_DEFINITIONS.map((definition) => definition.id),
    ).toEqual([...DOCS_COLLECTION_IDS]);
    expect(listDocsCollectionDefinitions()).toHaveLength(
      DOCS_COLLECTION_IDS.length,
    );
  });

  test("uses current public route slugs for each collection", () => {
    for (const definition of DOCS_COLLECTION_DEFINITIONS) {
      expect(definition.routeSlug).toBe(definition.id);
    }
  });

  test("uses current frontmatter and registry kinds", () => {
    expect(getDocsCollectionDefinition("guides")).toMatchObject({
      routeSlug: "guides",
      frontmatterKind: "guide",
      registryKind: "guide",
    });
    expect(getDocsCollectionDefinition("concepts")).toMatchObject({
      frontmatterKind: "concept",
      registryKind: "concept",
    });
    expect(getDocsCollectionDefinition("techniques")).toMatchObject({
      frontmatterKind: "technique",
      registryKind: "technique",
    });
    expect(getDocsCollectionDefinition("documentation")).toMatchObject({
      frontmatterKind: "documentation",
      registryKind: "documentation",
    });
    expect(getDocsCollectionDefinition("glossary")).toMatchObject({
      routeSlug: "glossary",
      frontmatterKind: "glossary",
      registryKind: "concept",
    });
  });

  test("keeps CLI collection starter and featured slug lists empty", () => {
    for (const id of EMPTY_CLI_COLLECTION_IDS) {
      expect(getDocsCollectionDefinition(id).starterSlugs).toEqual([]);
    }
  });

  test("preserves glossary browse starter slugs as route-relative docs slugs", () => {
    expect(getDocsCollectionDefinition("glossary").starterSlugs).toEqual([
      "glossary/token",
      "glossary/architecture",
    ]);

    for (const definition of DOCS_COLLECTION_DEFINITIONS) {
      if (
        (EMPTY_CLI_COLLECTION_IDS as readonly string[]).includes(definition.id)
      ) {
        expect(definition.starterSlugs).toEqual([]);
        continue;
      }

      expect(definition.starterSlugs.length).toBeGreaterThan(0);
      for (const slug of definition.starterSlugs) {
        expect(slug.startsWith(`${definition.routeSlug}/`)).toBe(true);
      }
    }
  });

  test("excludes retired Atlas collection ids from the public inventory", () => {
    const ids = DOCS_COLLECTION_DEFINITIONS.map((definition) => definition.id);
    for (const retiredId of [
      "modules",
      "models",
      "papers",
      "training",
      "systems",
    ] as const) {
      expect(ids).not.toContain(retiredId);
    }
  });

  test("includes message keys that resolve to current browse and index copy", async () => {
    const messages = await loadUiMessages();

    for (const definition of DOCS_COLLECTION_DEFINITIONS) {
      expectResolvableMessageKeys(messages, definition.messageKeys);
    }
  });

  test("identifies sidebar grouping resolver ids for grouped collections", () => {
    const groupedIds = ["glossary", "concepts"] as const;

    for (const id of groupedIds) {
      const definition = getDocsCollectionDefinition(id);
      const resolverId = definition.sidebarGroupingResolverId;
      expect(resolverId).toBe(id);
      if (!resolverId) {
        throw new Error(`expected sidebar grouping resolver id for ${id}`);
      }
      expect(DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS).toContain(
        resolverId,
      );
    }
  });

  test("omits sidebar grouping resolver ids for ungrouped collections", () => {
    const ungroupedIds = new Set<string>([
      "guides",
      "techniques",
      "documentation",
    ]);

    for (const id of ungroupedIds) {
      expect(
        getDocsCollectionDefinition(id as (typeof DOCS_COLLECTION_IDS)[number])
          .sidebarGroupingResolverId,
      ).toBeUndefined();
    }

    for (const id of DOCS_COLLECTION_IDS) {
      const definition = getDocsCollectionDefinition(id);
      if (ungroupedIds.has(id)) {
        expect(definition.sidebarGroupingResolverId).toBeUndefined();
        continue;
      }

      expect(definition.sidebarGroupingResolverId).toBe(
        id as "glossary" | "concepts",
      );
    }
  });
});
