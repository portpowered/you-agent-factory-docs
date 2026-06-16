import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import {
  GITHUB_REPO_URL,
  type SharedShellConfig,
  type SharedShellDocsNavigationGroup,
} from "@/lib/shared-shell-config";
import type { SharedShellMessageKey } from "@/types/localization";

type MessageLookup = (key: SharedShellMessageKey) => string;

type SharedShellMessageConfigOverrides = {
  docsNavigationGroups?: SharedShellDocsNavigationGroup[];
};

/** Builds shared shell configuration from localized message lookup. */
export function createSharedShellConfigFromMessages(
  t: MessageLookup,
  overrides?: SharedShellMessageConfigOverrides,
): SharedShellConfig {
  const destinations = {
    home: {
      id: "home",
      label: t("common.home"),
      href: "/",
    },
    docs: {
      id: "docs",
      label: t("common.getStarted"),
      href: DOCS_ENTRY_ROUTE,
    },
    github: {
      id: "github",
      label: t("common.githubCta"),
      href: GITHUB_REPO_URL,
      external: true,
    },
  } as const;

  return {
    brand: PROJECT_NAME,
    primaryNavigation: {
      ariaLabel: t("landing.primaryNavAriaLabel"),
      destinations: [destinations.home, destinations.docs, destinations.github],
    },
    headerDestinationIdsBySurface: {
      home: [destinations.docs.id, destinations.github.id],
      docs: [destinations.home.id, destinations.github.id],
    },
    docsNavigationGroups: overrides?.docsNavigationGroups ?? [
      {
        heading: t("docs.navHeading"),
        items: [
          {
            id: "overview",
            label: t("docs.navOverview"),
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
      narrowMaxWidthPx: 768,
      navigationDisclosure: {
        openLabel: t("shell.openMenuLabel"),
        closeLabel: t("shell.closeMenuLabel"),
      },
    },
  };
}
