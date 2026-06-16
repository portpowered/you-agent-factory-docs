import type { PartialSharedShellMessages } from "@/types/localization";

/** Partial French shared shell messages; missing keys fall back to the default locale. */
export const frMessages: PartialSharedShellMessages = {
  common: {
    getStarted: "Commencer",
    home: "Accueil",
  },
  landing: {
    primaryNavAriaLabel: "Principale",
  },
  docs: {
    siteNavAriaLabel: "Site",
    navHeading: "Navigation de la documentation",
  },
};
