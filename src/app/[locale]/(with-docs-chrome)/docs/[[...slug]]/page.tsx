import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildStaticSurfaceMetadata,
  renderBrowseIndexPage,
} from "@/app/(site)/site-renderers";
import {
  buildDocsPageMetadata,
  renderDocsSlugPage,
} from "@/app/docs/docs-slug-renderer";
import { ensureStaticExportParams } from "@/lib/build/static-export";
import { omitRetiredAtlasDocsStaticParams } from "@/lib/build/static-export-legacy-compile-graph";
import { buildDocsCatchAllStaticParamsFromDocsSlugs } from "@/lib/content/docs-catch-all-static-params";
import {
  isDocsPageShippedForLocale,
  loadShippedLocalizedDocsPages,
} from "@/lib/content/pages";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  generateStaticLocaleParams,
  resolveRouteLocaleOrNotFound,
} from "@/lib/i18n/route-locale";

type LocalizedDocsSlugPageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

/** Placeholder slug when no localized docs pages remain (static export requires ≥1 param). */
const STATIC_EXPORT_EMPTY_DOCS_SLUG = ["__no_localized_docs_pages__"];

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug?: string[] }> = [];

  for (const { locale } of generateStaticLocaleParams()) {
    params.push({ locale, slug: [] });
    const pages = await loadShippedLocalizedDocsPages(locale);
    for (const entry of buildDocsCatchAllStaticParamsFromDocsSlugs(
      pages.map((page) => page.docsSlug),
    )) {
      params.push({
        locale,
        slug: entry.slug,
      });
    }
  }

  const [{ locale: placeholderLocale }] = generateStaticLocaleParams();
  return ensureStaticExportParams(omitRetiredAtlasDocsStaticParams(params), {
    locale: placeholderLocale,
    slug: STATIC_EXPORT_EMPTY_DOCS_SLUG,
  });
}

export async function generateMetadata({
  params,
}: LocalizedDocsSlugPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);
  if (!slug || slug.length === 0) {
    const messages = await loadUiMessages(locale);
    return buildStaticSurfaceMetadata(
      { surface: "browse" },
      {
        title: messages.browseIndex.title,
        description: messages.browseIndex.description,
      },
    );
  }
  const docsSlug = slug?.join("/");
  if (docsSlug && !isDocsPageShippedForLocale(docsSlug, locale)) {
    notFound();
  }
  return buildDocsPageMetadata(slug, locale);
}

export default async function LocalizedDocsSlugPage({
  params,
}: LocalizedDocsSlugPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);
  if (!slug || slug.length === 0) {
    return renderBrowseIndexPage(locale);
  }
  const docsSlug = slug?.join("/");
  if (docsSlug && !isDocsPageShippedForLocale(docsSlug, locale)) {
    notFound();
  }
  return renderDocsSlugPage(slug, locale);
}
