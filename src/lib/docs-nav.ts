import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { DOCS_NAV_HEADING, DOCS_NAV_OVERVIEW_LABEL } from "@/lib/shell";
import type { DocsNavSection } from "@/types/docs-nav";

/**
 * Canonical docs nav section consumed by `DocsShellNav`.
 * Extend `items` here when later docs navigation depth ships.
 */
export const DOCS_NAV_SECTION: DocsNavSection = {
  heading: DOCS_NAV_HEADING,
  items: [
    {
      href: DOCS_ENTRY_ROUTE,
      label: DOCS_NAV_OVERVIEW_LABEL,
      isCurrent: true,
    },
  ],
};
