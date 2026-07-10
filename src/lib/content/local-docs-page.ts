import { loadConceptPage } from "@/lib/content/concept-page";
import type { LoadedConceptPage } from "@/lib/content/concept-page-load";
import { loadDocumentationPage } from "@/lib/content/documentation-page";
import type { LoadedDocumentationPage } from "@/lib/content/documentation-page-load";
import { loadGlossaryPage } from "@/lib/content/glossary-page";
import type { LoadedGlossaryPage } from "@/lib/content/glossary-page-load";
import { loadGuidePage } from "@/lib/content/guide-page";
import type { LoadedGuidePage } from "@/lib/content/guide-page-load";
import { loadTechniquePage } from "@/lib/content/technique-page";
import type { LoadedTechniquePage } from "@/lib/content/technique-page-load";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

export type LocalDocsPageRef =
  | { section: "guides"; slug: string }
  | { section: "concepts"; slug: string }
  | { section: "techniques"; slug: string }
  | { section: "documentation"; slug: string }
  | { section: "glossary"; slug: string };

export type LoadedLocalDocsPage =
  | LoadedGuidePage
  | LoadedConceptPage
  | LoadedTechniquePage
  | LoadedDocumentationPage
  | LoadedGlossaryPage;

const LOCAL_DOCS_SECTIONS = new Set([
  "guides",
  "concepts",
  "techniques",
  "documentation",
  "glossary",
]);

/** Parses catch-all slug segments for local-message page bundles. */
export function parseLocalDocsPageRef(
  slug: string[] | undefined,
): LocalDocsPageRef | null {
  if (slug?.length !== 2) {
    return null;
  }

  if (LOCAL_DOCS_SECTIONS.has(slug[0])) {
    return { section: slug[0] as LocalDocsPageRef["section"], slug: slug[1] };
  }

  return null;
}

/** True when Fumadocs frontmatter marks a page as colocated local messages. */
export function isLocalMessageDocsPage(pageData: {
  messageNamespace?: unknown;
}): boolean {
  return pageData.messageNamespace === "local";
}

/** True when catch-all slug segments identify a local docs page bundle. */
export function isLocalDocsCatchAllSlug(slug: string[] | undefined): boolean {
  return parseLocalDocsPageRef(slug) !== null;
}

export function localDocsRoute(
  ref: LocalDocsPageRef,
  locale: SiteLocale = defaultLocale,
): string {
  return buildLocalizedRoute(
    {
      surface: "docs-page",
      slug: `${ref.section}/${ref.slug}`,
    },
    locale,
  );
}

/** Loads a local docs page bundle with colocated messages and assets. */
export async function loadLocalDocsPage(
  ref: LocalDocsPageRef,
  locale: SiteLocale = defaultLocale,
): Promise<LoadedLocalDocsPage> {
  switch (ref.section) {
    case "guides":
      return loadGuidePage(ref.slug, locale);
    case "concepts":
      return loadConceptPage(ref.slug, locale);
    case "techniques":
      return loadTechniquePage(ref.slug, locale);
    case "documentation":
      return loadDocumentationPage(ref.slug, locale);
    case "glossary":
      return loadGlossaryPage(ref.slug, locale);
  }
}
