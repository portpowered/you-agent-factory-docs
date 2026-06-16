/** Default-locale shared shell messages for homepage and docs entry surfaces. */
export const enMessages = {
  common: {
    githubCta: "View on GitHub",
    getStarted: "Get started",
    home: "Home",
  },
  landing: {
    primaryNavAriaLabel: "Primary",
    valueStatement:
      "Turn recurring engineering work into reusable, inspectable AI agent workflows you can run locally and evolve with your team.",
  },
  docs: {
    siteNavAriaLabel: "Site",
    navHeading: "Docs navigation",
    navOverview: "Overview",
    shellTitle: "Documentation",
    framingText:
      "This is the stable docs entry route. Later navigation, localization, and content systems extend this shell without changing route structure.",
  },
} as const;

export type SharedShellMessages = typeof enMessages;
