/** Stable docs nav item shape; later depth lanes add siblings without shell rewrites. */
export type DocsNavItem = {
  href: string;
  label: string;
  /** Set when the item matches the active docs route. */
  isCurrent?: boolean;
};

/** Grouped docs navigation section rendered by the shared docs shell nav surface. */
export type DocsNavSection = {
  heading: string;
  items: DocsNavItem[];
};
