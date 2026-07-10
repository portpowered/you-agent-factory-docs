import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCS_COLLECTION_IDS,
  DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS,
} from "@/lib/docs/collection-definition-contract";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import {
  getDocsShellPageTreeSettings,
  getDocsShellSidebarGroupingResolvers,
  listDocsShellCollectionIds,
  listDocsShellSidebarDefinitions,
  resolveDocsSidebarFolderLabel,
} from "@/lib/navigation/docs-sidebar-adapter";

const EXPECTED_DOCS_SIDEBAR_FOLDER_LABELS = [
  "Guides",
  "Concepts",
  "Techniques",
  "Documentation",
  "Glossary",
] as const;

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
}

describe("docs sidebar adapter", () => {
  test("exposes shell sidebar definitions in configured collection order", () => {
    const definitions = listDocsShellSidebarDefinitions();
    const collectionDefinitions = listDocsCollectionDefinitions();

    expect(definitions.map((definition) => definition.id)).toEqual(
      collectionDefinitions.map((definition) => definition.id),
    );
    expect(definitions.map((definition) => definition.id)).toEqual([
      ...DOCS_COLLECTION_IDS,
    ]);
    expect(listDocsShellCollectionIds()).toEqual([...DOCS_COLLECTION_IDS]);
    expect(definitions.map((definition) => definition.sidebarLabel)).toEqual([
      ...EXPECTED_DOCS_SIDEBAR_FOLDER_LABELS,
    ]);
  });

  test("bundles adapter page-tree settings for generic shell composition", () => {
    const settings = getDocsShellPageTreeSettings();

    expect(settings.definitions).toEqual(listDocsShellSidebarDefinitions());
    expect(settings.collectionIds).toEqual(listDocsShellCollectionIds());
    expect(Object.keys(settings.groupingResolvers).sort()).toEqual(
      [...DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS].sort(),
    );
  });

  test("preserves collection routing and grouping resolver ids from definitions", () => {
    const definitions = listDocsShellSidebarDefinitions();
    const collectionDefinitions = listDocsCollectionDefinitions();

    for (const [index, definition] of definitions.entries()) {
      const sourceDefinition = collectionDefinitions[index];
      expect(definition.routeSlug).toBe(sourceDefinition.routeSlug);
      expect(definition.frontmatterKind).toBe(sourceDefinition.frontmatterKind);
      expect(definition.sidebarGroupingResolverId).toBe(
        sourceDefinition.sidebarGroupingResolverId,
      );
      expect(definition.sidebarLabel).toBe(
        resolveDocsSidebarFolderLabel(sourceDefinition.id),
      );
    }
  });

  test("exposes grouping resolvers for grouped factory collections only", () => {
    const resolvers = getDocsShellSidebarGroupingResolvers();

    expect(Object.keys(resolvers).sort()).toEqual(
      [...DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS].sort(),
    );
    expect(resolvers.modules).toBeUndefined();
    expect(resolvers.models).toBeUndefined();
    expect(resolvers.training).toBeUndefined();
    expect(resolvers.systems).toBeUndefined();
  });

  test("grouping resolvers produce separator labels for configured collections with pages", () => {
    const resolvers = getDocsShellSidebarGroupingResolvers();

    for (const definition of listDocsCollectionDefinitions()) {
      const resolverId = definition.sidebarGroupingResolverId;
      if (!resolverId) {
        continue;
      }

      const pages = loadPublishedDocsPagesSync("en").filter((page) =>
        page.docsSlug.startsWith(`${definition.routeSlug}/`),
      );
      if (pages.length === 0) {
        continue;
      }

      const nodes = resolvers[resolverId]?.(pages) ?? [];

      expect(nodes.length).toBeGreaterThan(0);
      expect(getSeparatorLabels(nodes).length).toBeGreaterThan(0);
    }
  });
});
