import { loadConceptPage } from "@/lib/content/concept-page";
import type { LoadedConceptPage } from "@/lib/content/concept-page-load";
import type { DocsSection } from "@/lib/content/content-paths";
import { DOCS_SECTIONS } from "@/lib/content/content-paths";
import { loadDocumentationPage } from "@/lib/content/documentation-page";
import type { LoadedDocumentationPage } from "@/lib/content/documentation-page-load";
import { loadGlossaryPage } from "@/lib/content/glossary-page";
import type { LoadedGlossaryPage } from "@/lib/content/glossary-page-load";
import { loadGuidePage } from "@/lib/content/guide-page";
import type { LoadedGuidePage } from "@/lib/content/guide-page-load";
import {
  type LoadedRouteFamilyLocalDocsPage,
  loadRouteFamilyLocalDocsPage,
} from "@/lib/content/route-family-local-docs-page";
import { loadTechniquePage } from "@/lib/content/technique-page";
import type { LoadedTechniquePage } from "@/lib/content/technique-page-load";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

export type LocalDocsPageRef = {
  section: DocsSection;
  /** Page slug; may include nested segments joined with `/` (`agent/variant`). */
  slug: string;
};

export type LoadedLocalDocsPage =
  | LoadedGuidePage
  | LoadedConceptPage
  | LoadedTechniquePage
  | LoadedDocumentationPage
  | LoadedGlossaryPage
  | LoadedRouteFamilyLocalDocsPage;

const LOCAL_DOCS_SECTIONS = new Set<string>(DOCS_SECTIONS);

/** Parses catch-all slug segments for local-message page bundles. */
export function parseLocalDocsPageRef(
  slug: string[] | undefined,
): LocalDocsPageRef | null {
  // Section + one or more page segments (two-segment and deeper nested pages).
  // One-segment collection indexes must not parse as page refs.
  if (!slug || slug.length < 2) {
    return null;
  }

  const section = slug[0];
  if (!section || !LOCAL_DOCS_SECTIONS.has(section)) {
    return null;
  }

  const pageSlug = slug.slice(1).join("/");
  if (!pageSlug) {
    return null;
  }

  return { section: section as DocsSection, slug: pageSlug };
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
  docsRoot?: string,
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
    case "references":
    case "factories":
    case "workers":
    case "workstations":
      return loadRouteFamilyLocalDocsPage(
        ref.section,
        ref.slug,
        locale,
        docsRoot,
      );
  }
}
