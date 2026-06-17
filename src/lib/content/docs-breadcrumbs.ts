import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";

/** One breadcrumb position projected from docs navigation ancestry. */
export type DocsBreadcrumbItem = {
  label: string;
  href?: string;
};

/** Projected breadcrumb trail consumed by the docs shell UI. */
export type DocsBreadcrumbTrail = {
  items: DocsBreadcrumbItem[];
};

export type ProjectDocsBreadcrumbsOptions = {
  currentPath: string;
  docsRootLabel: string;
  docsRootHref?: string;
};

/**
 * Projects breadcrumb position from generated docs navigation ancestry.
 * Shell labels such as the docs root resolve through localization; section and
 * page labels come from projected navigation state.
 */
export function projectDocsBreadcrumbs(
  navigation: DocsShellNavigationInput,
  options: ProjectDocsBreadcrumbsOptions,
): DocsBreadcrumbTrail {
  const docsRootHref = options.docsRootHref ?? DOCS_ENTRY_ROUTE;

  if (options.currentPath === docsRootHref) {
    return {
      items: [{ label: options.docsRootLabel }],
    };
  }

  for (const section of navigation.sections) {
    for (const page of section.pages) {
      if (page.href === options.currentPath) {
        return {
          items: [
            { label: options.docsRootLabel, href: docsRootHref },
            { label: section.label },
            { label: page.label },
          ],
        };
      }
    }
  }

  return {
    items: [{ label: options.docsRootLabel, href: docsRootHref }],
  };
}
