import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";

/** One sequential progression link projected from docs navigation ordering. */
export type DocsProgressionLink = {
  label: string;
  href: string;
};

/** Projected previous-next progression consumed by the docs shell UI. */
export type DocsProgressionLinks = {
  previous?: DocsProgressionLink;
  next?: DocsProgressionLink;
};

export type ProjectDocsProgressionOptions = {
  currentPath: string;
  docsRootHref?: string;
};

function flattenDocsNavigationSequence(
  navigation: DocsShellNavigationInput,
): DocsProgressionLink[] {
  return navigation.sections.flatMap((section) =>
    section.pages.map((page) => ({
      label: page.label,
      href: page.href,
    })),
  );
}

/**
 * Projects previous-next progression from generated docs navigation ordering.
 * Section and page order follow the same projection rules as left navigation.
 */
export function projectDocsProgression(
  navigation: DocsShellNavigationInput,
  options: ProjectDocsProgressionOptions,
): DocsProgressionLinks {
  const docsRootHref = options.docsRootHref ?? DOCS_ENTRY_ROUTE;
  const sequence = flattenDocsNavigationSequence(navigation);
  const currentIndex = sequence.findIndex(
    (page) => page.href === options.currentPath,
  );

  if (currentIndex >= 0) {
    const previous = currentIndex > 0 ? sequence[currentIndex - 1] : undefined;
    const next =
      currentIndex < sequence.length - 1
        ? sequence[currentIndex + 1]
        : undefined;

    return { previous, next };
  }

  if (options.currentPath === docsRootHref && sequence.length > 0) {
    return { next: sequence[0] };
  }

  return {};
}
