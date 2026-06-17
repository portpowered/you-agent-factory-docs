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
    navHeading: "Navigation de la documentation",
    searchTitle: "Rechercher dans la documentation",
    searchLabel: "Rechercher dans la documentation",
    searchPlaceholder: "Rechercher l'installation, les guides et les concepts",
    searchHelperText:
      "Les resultats proviennent de l'artefact de recherche public genere via le chemin de requete Orama.",
    searchLoading: "Chargement de l'index de recherche...",
    searchSearching: "Recherche dans la documentation...",
    searchEmptyQuery:
      "Saisissez une requete pour rechercher dans la documentation publiee de la langue active.",
    searchNoResults:
      "Aucune documentation correspondante n'a ete trouvee pour cette requete.",
    searchError:
      "La recherche est temporairement indisponible, car l'artefact de recherche public n'a pas pu etre charge.",
    searchResultsLabel: "documentation correspondante",
  },
};
