import {
  conceptPageHref,
  documentationPageHref,
  glossaryPageHref,
  guidePageHref,
  referencePageHref,
  techniquePageHref,
} from "@/lib/content/content-hrefs";
import type { PageKind } from "@/lib/content/schemas";

export const PUBLISHED_DOCS_SECTIONS = [
  "glossary",
  "concepts",
  "guides",
  "techniques",
  "documentation",
  "references",
] as const;

export type PublishedDocsSection = (typeof PUBLISHED_DOCS_SECTIONS)[number];
export type PublishedDocsRegistryIds = ReadonlySet<string>;

export type PublishedDocsEntry = {
  registryId: string;
  slug: string;
  docsSlug: string;
  url: string;
  pageKind: PageKind;
  section: PublishedDocsSection;
};

export type PublishedDocsRecordRef = {
  id: string;
  slug: string;
  kind: string;
};

export function docsSectionFromSlug(docsSlug: string): PublishedDocsSection {
  const [section] = docsSlug.split("/");
  if (!section) {
    throw new Error(`Cannot derive docs section from empty docs slug`);
  }

  if (PUBLISHED_DOCS_SECTIONS.includes(section as PublishedDocsSection)) {
    return section as PublishedDocsSection;
  }

  throw new Error(
    `Unsupported published docs section "${section}" for docs slug "${docsSlug}"`,
  );
}

export function publishedDocsHrefFromEntry(entry: PublishedDocsEntry): string {
  switch (entry.section) {
    case "glossary":
      return glossaryPageHref(entry.slug);
    case "concepts":
      return conceptPageHref(entry.slug);
    case "guides":
      return guidePageHref(entry.slug);
    case "techniques":
      return techniquePageHref(entry.slug);
    case "documentation":
      return documentationPageHref(entry.slug);
    case "references":
      // Prefer docsSlug so nested reference routes keep full path segments.
      return referencePageHref(
        entry.docsSlug.startsWith("references/")
          ? entry.docsSlug.slice("references/".length)
          : entry.slug,
      );
  }
}
