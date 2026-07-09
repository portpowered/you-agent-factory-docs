import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildDocsPageMetadata,
  renderDocsSlugPage,
} from "@/app/docs/docs-slug-renderer";
import { ensureStaticExportParams } from "@/lib/build/static-export";
import {
  isDocsPageShippedForLocale,
  loadShippedLocalizedDocsPages,
} from "@/lib/content/pages";
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
    const pages = await loadShippedLocalizedDocsPages(locale);
    for (const page of pages) {
      params.push({
        locale,
        slug: page.docsSlug.split("/"),
      });
    }
  }

  const [{ locale: placeholderLocale }] = generateStaticLocaleParams();
  return ensureStaticExportParams(params, {
    locale: placeholderLocale,
    slug: STATIC_EXPORT_EMPTY_DOCS_SLUG,
  });
}

export async function generateMetadata({
  params,
}: LocalizedDocsSlugPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);
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
  const docsSlug = slug?.join("/");
  if (docsSlug && !isDocsPageShippedForLocale(docsSlug, locale)) {
    notFound();
  }
  return renderDocsSlugPage(slug, locale);
}
