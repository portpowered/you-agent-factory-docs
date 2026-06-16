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
    breadcrumbAriaLabel: "Breadcrumb",
    progressionAriaLabel: "Page progression",
    previousPagePrefix: "Previous",
    nextPagePrefix: "Next",
    shellTitle: "Documentation",
    framingText:
      "This is the stable docs entry route. Later navigation, localization, and content systems extend this shell without changing route structure.",
  },
} as const;

export type SharedShellMessages = typeof enMessages;
