import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import { RESPONSIVE_BREAKPOINTS_PX } from "@/lib/responsive-tokens";

/** Canonical destination in shared shell navigation and CTAs. */
export type SharedShellDestination = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

/** Primary header navigation contract shared across homepage and docs entry. */
export type SharedShellPrimaryNavigation = {
  ariaLabel: string;
  destinations: SharedShellDestination[];
};

/** Docs-specific sidebar navigation group for the docs entry surface. */
export type SharedShellDocsNavigationGroup = {
  heading: string;
  items: Array<{
    id: string;
    label: string;
    href: string;
  }>;
};

/** Structural shell options later lanes can extend without rewriting the frame. */
export type SharedShellStructuralOptions = {
  showDocsSidebar: boolean;
  footerText?: string;
};

/** SSR-safe responsive shell options; keep in sync with shared-shell media queries in globals.css. */
export type SharedShellResponsiveOptions = {
  narrowMaxWidthPx: number;
  navigationDisclosure: {
    openLabel: string;
    closeLabel: string;
  };
  docsNavigationDisclosure: {
    openLabel: string;
    closeLabel: string;
  };
};

/**
 * Canonical extendable shell configuration.
 * Transient UI such as menu open state belongs in component state, not here.
 */
export type SharedShellConfig = {
  brand: string;
  primaryNavigation: SharedShellPrimaryNavigation;
  headerDestinationIdsBySurface: Record<SharedShellSurface, string[]>;
  /** Extend this array for richer docs navigation without changing the shell frame. */
  docsNavigationGroups: SharedShellDocsNavigationGroup[];
  structural: SharedShellStructuralOptions;
  responsive: SharedShellResponsiveOptions;
};

export type SharedShellSurface = "home" | "docs";

/** Public factory repository; the docs repo may be private during bootstrap. */
export const GITHUB_REPO_URL =
  "https://github.com/portpowered/you-agent-factory";

export const GITHUB_CTA_LABEL = "View on GitHub";

export const DOCS_CTA_LABEL = "Get started";

export const HOME_CTA_LABEL = "Home";

export const LANDING_VALUE_STATEMENT =
  "Turn recurring engineering work into reusable, inspectable AI agent workflows you can run locally and evolve with your team.";

export const DOCS_SHELL_TITLE = "Documentation";

export const DOCS_NAV_HEADING = "Docs navigation";

export const DOCS_NAV_OVERVIEW_LABEL = "Overview";

export const DOCS_SHELL_FRAMING_TEXT =
  "This is the stable docs entry route. Later navigation, localization, and content systems extend this shell without changing route structure.";

const sharedShellDestinations = {
  home: {
    id: "home",
    label: HOME_CTA_LABEL,
    href: "/",
  },
  docs: {
    id: "docs",
    label: DOCS_CTA_LABEL,
    href: DOCS_ENTRY_ROUTE,
  },
  github: {
    id: "github",
    label: GITHUB_CTA_LABEL,
    href: GITHUB_REPO_URL,
    external: true,
  },
} as const satisfies Record<string, SharedShellDestination>;

export const sharedShellConfig: SharedShellConfig = {
  brand: PROJECT_NAME,
  primaryNavigation: {
    ariaLabel: "Primary",
    destinations: [
      sharedShellDestinations.home,
      sharedShellDestinations.docs,
      sharedShellDestinations.github,
    ],
  },
  headerDestinationIdsBySurface: {
    home: [sharedShellDestinations.docs.id, sharedShellDestinations.github.id],
    docs: [sharedShellDestinations.home.id, sharedShellDestinations.github.id],
  },
  docsNavigationGroups: [
    {
      heading: DOCS_NAV_HEADING,
      items: [
        {
          id: "overview",
          label: DOCS_NAV_OVERVIEW_LABEL,
          href: DOCS_ENTRY_ROUTE,
        },
      ],
    },
  ],
  structural: {
    showDocsSidebar: true,
    footerText: PROJECT_NAME,
  },
  responsive: {
    narrowMaxWidthPx: RESPONSIVE_BREAKPOINTS_PX.tabletMax,
    navigationDisclosure: {
      openLabel: "Open menu",
      closeLabel: "Close menu",
    },
    docsNavigationDisclosure: {
      openLabel: "Show docs navigation",
      closeLabel: "Hide docs navigation",
    },
  },
};

/** Destination id for the active surface; used for current-location treatment in primary nav. */
export function getSharedShellCurrentDestinationId(
  surface: SharedShellSurface,
  config: SharedShellConfig = sharedShellConfig,
): string | undefined {
  const surfaceDestinationId = surface === "home" ? "home" : "docs";

  const isVisibleInHeader =
    config.headerDestinationIdsBySurface[surface].includes(
      surfaceDestinationId,
    );

  return isVisibleInHeader ? surfaceDestinationId : undefined;
}

export function getSharedShellHeaderDestinations(
  surface: SharedShellSurface,
  config: SharedShellConfig = sharedShellConfig,
): SharedShellDestination[] {
  const destinationById = new Map(
    config.primaryNavigation.destinations.map((destination) => [
      destination.id,
      destination,
    ]),
  );

  return config.headerDestinationIdsBySurface[surface]
    .map((destinationId) => destinationById.get(destinationId))
    .filter((destination): destination is SharedShellDestination =>
      Boolean(destination),
    );
}

export function shouldRenderDocsSidebar(
  surface: SharedShellSurface,
  config: SharedShellConfig = sharedShellConfig,
): boolean {
  return surface === "docs" && config.structural.showDocsSidebar;
}
