import type { Root } from "fumadocs-core/page-tree";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import { getDocsShellPageTreeSettings } from "@/lib/navigation/docs-sidebar-adapter";
import { buildDocsSidebarSectionNodes } from "@/lib/navigation/docs-sidebar-sections";

export function buildGeneratedDocsPageTree(baseTree: Root): Root {
  const pages = loadPublishedDocsPagesSync("en");
  const { definitions, groupingResolvers } = getDocsShellPageTreeSettings();

  return {
    ...baseTree,
    children: buildDocsSidebarSectionNodes({
      pages,
      definitions,
      groupingResolvers,
    }),
  };
}
