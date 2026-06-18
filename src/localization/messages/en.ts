/** Default-locale shared shell messages for homepage and docs entry surfaces. */
export const enMessages = {
  common: {
    githubCta: "Try on GitHub",
    getStarted: "Get started",
    home: "Home",
  },
  shell: {
    openMenuLabel: "Open menu",
    closeMenuLabel: "Close menu",
    showDocsNavLabel: "Show docs navigation",
    hideDocsNavLabel: "Hide docs navigation",
  },
  landing: {
    primaryNavAriaLabel: "Primary",
    valueStatement:
      "Turn recurring engineering work into reusable, inspectable AI agent workflows you can run locally and evolve with your team.",
  },
  docs: {
    navHeading: "Docs navigation",
    navOverview: "Overview",
    searchTitle: "Search docs",
    searchLabel: "Search documentation",
    searchPlaceholder: "Search setup, guides, and concepts",
    searchHelperText:
      "Results come from the generated public search artifact through the Orama-backed query path.",
    searchLoading: "Loading the search index...",
    searchSearching: "Searching documentation...",
    searchEmptyQuery:
      "Type a query to search the current locale's published docs.",
    searchNoResults: "No matching docs found for this query.",
    searchError:
      "Search is temporarily unavailable because the public search artifact could not be loaded.",
    searchResultsLabel: "matching docs",
    breadcrumbAriaLabel: "Breadcrumb",
    glossarySectionLabel: "Glossary",
    comparisonSectionLabel: "Comparisons",
    referenceSectionLabel: "References",
    progressionAriaLabel: "Page progression",
    previousPagePrefix: "Previous",
    nextPagePrefix: "Next",
    onThisPageLabel: "On this page",
    pageOutlineAriaLabel: "On this page",
    shellTitle: "Documentation",
    framingText:
      "This is the stable docs entry route. Later navigation, localization, and content systems extend this shell without changing route structure.",
    examplesHeading: "Diagram rendering examples",
    examplesText:
      "These fixtures prove the two supported docs-diagram paths from checked-in authored definitions through responsive rendering.",
    mermaidExampleLabel:
      "Mermaid renders simple explanatory workflow diagrams.",
    reactFlowExampleLabel:
      "React Flow renders workflow and agent graph diagrams.",
  },
} as const;

export type SharedShellMessages = typeof enMessages;
