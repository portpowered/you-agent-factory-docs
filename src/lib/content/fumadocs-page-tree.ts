import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";
import type { PageTree } from "fumadocs-core/server";

type ProjectFumadocsPageTreeOptions = {
  rootName?: string;
};

export function projectFumadocsPageTree(
  navigation: DocsShellNavigationInput,
  options: ProjectFumadocsPageTreeOptions = {},
): PageTree.Root {
  return {
    name: options.rootName ?? "Documentation",
    children: navigation.sections.map((section) => ({
      type: "folder" as const,
      defaultOpen: true,
      name: section.label,
      root: true,
      children: section.pages.map((page) => ({
        type: "page" as const,
        name: page.label,
        url: page.href,
      })),
    })),
  };
}
