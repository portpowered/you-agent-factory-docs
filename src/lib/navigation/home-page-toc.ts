import type { TOCItemType } from "fumadocs-core/toc";

import type { UiMessages } from "@/lib/content/ui-messages.types";

/** Home section headings render as h2 in the article body. */
const HOME_SECTION_TOC_DEPTH = 2;

/** Builds the home page On this page TOC in article section order. */
export function buildHomeTableOfContents(
  home: UiMessages["home"],
): TOCItemType[] {
  return [
    {
      title: home.onThisPageInstall,
      url: "#install",
      depth: HOME_SECTION_TOC_DEPTH,
    },
    {
      title: home.onThisPageRun,
      url: "#run",
      depth: HOME_SECTION_TOC_DEPTH,
    },
    {
      title: home.onThisPageWhy,
      url: "#why",
      depth: HOME_SECTION_TOC_DEPTH,
    },
    {
      title: home.onThisPageFeatures,
      url: "#features",
      depth: HOME_SECTION_TOC_DEPTH,
    },
    {
      title: home.onThisPageBrowse,
      url: "#browse",
      depth: HOME_SECTION_TOC_DEPTH,
    },
  ];
}
