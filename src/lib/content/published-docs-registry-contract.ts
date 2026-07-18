import {
  conceptPageHref,
  documentationPageHref,
  glossaryPageHref,
  guidePageHref,
  referencePageHref,
  techniquePageHref,
  workersPageHref,
  workstationsPageHref,
} from "@/lib/content/content-hrefs";
import type { PageKind } from "@/lib/content/schemas";

export const PUBLISHED_DOCS_SECTIONS = [
  "glossary",
  "concepts",
  "guides",
  "techniques",
  "documentation",
  "references",
  "workers",
  "workstations",
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

/**
 * Path under the published section used for canonical href helpers.
 *
 * Prefer the docsSlug remainder after `<section>/` so nested workers/workstations (and
 * future nested CLI) pages keep `/docs/<section>/<parent>/<child>` rather than
 * collapsing to the leaf segment alone.
 */
export function publishedDocsRelativeSlug(entry: PublishedDocsEntry): string {
  const prefix = `${entry.section}/`;
  if (entry.docsSlug.startsWith(prefix)) {
    const relative = entry.docsSlug.slice(prefix.length);
    if (relative.length > 0) {
      return relative;
    }
  }

  return entry.slug;
}

export function publishedDocsHrefFromEntry(entry: PublishedDocsEntry): string {
  const relativeSlug = publishedDocsRelativeSlug(entry);

  switch (entry.section) {
    case "glossary":
      return glossaryPageHref(relativeSlug);
    case "concepts":
      return conceptPageHref(relativeSlug);
    case "guides":
      return guidePageHref(relativeSlug);
    case "techniques":
      return techniquePageHref(relativeSlug);
    case "documentation":
      return documentationPageHref(relativeSlug);
    case "references":
      return referencePageHref(relativeSlug);
    case "workers":
      return workersPageHref(relativeSlug);
    case "workstations":
      return workstationsPageHref(relativeSlug);
  }
}
