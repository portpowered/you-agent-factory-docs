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
    navOverview: "Apercu",
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
    breadcrumbAriaLabel: "Fil d'Ariane",
    progressionAriaLabel: "Progression de page",
    previousPagePrefix: "Precedent",
    nextPagePrefix: "Suivant",
    onThisPageLabel: "Sur cette page",
    pageOutlineAriaLabel: "Sur cette page",
    shellTitle: "Documentation",
    framingText:
      "Ceci est la route d'entree stable de la documentation. Les futurs systemes de navigation, de localisation et de contenu etendent cette coquille sans changer la structure des routes.",
    examplesHeading: "Exemples de rendu de diagrammes",
    examplesText:
      "Ces fixtures prouvent les deux chemins de diagrammes pris en charge depuis des definitions redigees et versionnees jusqu'au rendu responsive.",
    mermaidExampleLabel:
      "Mermaid affiche des diagrammes de workflow explicatifs simples.",
    reactFlowExampleLabel:
      "React Flow affiche des graphes de workflow et d'agents.",
    search: {
      title: "Rechercher dans l artefact public genere",
      submitLabel: "Rechercher",
      keyboardHint:
        "Une fois les resultats charges, utilisez Fleche bas pour entrer dans la liste puis les touches flechees pour parcourir les resultats.",
      resultsListLabel: "Resultats de recherche",
      resultKinds: {
        doc: "Documentation",
        glossary: "Glossaire",
        reference: "Reference",
      },
      previewContexts: {
        heading: "Section correspondante",
        tag: "Tag correspondant",
      },
    },
  },
};
