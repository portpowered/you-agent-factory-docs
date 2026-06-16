import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";
import type { SharedShellDocsNavigationGroup } from "@/lib/shared-shell-config";
import { DOCS_NAV_HEADING } from "@/lib/shared-shell-config";

/**
 * Projects generated docs-shell navigation into shared-shell sidebar groups.
 */
export function projectSharedShellDocsNavigation(
  navigation: DocsShellNavigationInput,
  options?: { navHeading?: string },
): SharedShellDocsNavigationGroup[] {
  const navHeading = options?.navHeading ?? DOCS_NAV_HEADING;

  if (navigation.sections.length === 0) {
    return [];
  }

  return navigation.sections.map((section) => ({
    heading: section.label || navHeading,
    items: section.pages.map((page) => ({
      id: page.canonicalId,
      label: page.label,
      href: page.href,
    })),
  }));
}

export function findCurrentDocsItemId(
  navigation: DocsShellNavigationInput,
  currentPath: string,
): string | undefined {
  for (const section of navigation.sections) {
    for (const page of section.pages) {
      if (page.href === currentPath) {
        return page.canonicalId;
      }
    }
  }

  return undefined;
}
