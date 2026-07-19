import { shouldSuppressReferenceStandaloneSearchHeadings } from "./reference-owning-page-search-url";
import { topologySearchText } from "./topology-search-terms";
import type {
  FumadocsSearchIndexEntry,
  FumadocsStructuredData,
  SearchDocument,
} from "./types";

/**
 * Project a search document into Fumadocs structured data.
 *
 * Reference owning pages and inventory item deep links under
 * `/docs/references/**` omit standalone heading rows (`#heading-N`) so
 * subsection titles and item auto-heading children cannot flood advanced
 * search. Heading text is folded into page-level content so titles and
 * registry identifiers remain searchable. Exact inventory lookups stay on the
 * registry-anchor page URL — not Fumadocs `#heading-N` fragments.
 */
export function toStructuredData(
  document: SearchDocument,
): FumadocsStructuredData {
  const suppressStandaloneHeadings =
    shouldSuppressReferenceStandaloneSearchHeadings(document.url);

  const headings = suppressStandaloneHeadings
    ? []
    : document.headings.map((heading, index) => ({
        id: `heading-${index}`,
        content: heading,
      }));

  const pageBodyParts = [
    document.description,
    document.bodyText,
    ...(suppressStandaloneHeadings ? document.headings : []),
  ].filter(Boolean);

  const contents: FumadocsStructuredData["contents"] = [
    {
      // Owning reference pages stay at the canonical page URL — do not attach
      // a content.heading fragment that Fumadocs would turn into a deep link.
      heading: suppressStandaloneHeadings ? undefined : document.title,
      content: pageBodyParts.join("\n\n"),
    },
  ];

  if (document.aliases.length > 0) {
    contents.push({
      heading: undefined,
      content: document.aliases.join("\n"),
    });
  }

  if (document.tags.length > 0) {
    contents.push({
      heading: undefined,
      content: document.tags.join("\n"),
    });
  }

  const topologyTerms = topologySearchText(document);
  if (topologyTerms) {
    contents.push({
      heading: undefined,
      content: topologyTerms,
    });
  }

  return { headings, contents };
}

export function toFumadocsIndexEntry(
  document: SearchDocument,
): FumadocsSearchIndexEntry {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    url: document.url,
    structuredData: toStructuredData(document),
  };
}
