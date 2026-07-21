import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";
import { ensureStaticExportParams } from "@/lib/build/static-export";
import { blogPostHref, listBlogSlugs } from "@/lib/content/blog-page-load";
import { getPublishedBlogPostBySlug } from "@/lib/content/blog-post-get";
import { hasBlogPostMessagesForLocale } from "@/lib/content/blog-post-list";
import {
  generateStaticLocaleParams,
  resolveRouteLocaleOrNotFound,
} from "@/lib/i18n/route-locale";
import { withPageOpenGraph } from "@/lib/seo/page-open-graph";

type LocalizedBlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Placeholder slug when no localized blog posts exist (static export requires ≥1 param). */
const STATIC_EXPORT_EMPTY_BLOG_SLUG = "__no_localized_blog_posts__";

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];

  for (const { locale } of generateStaticLocaleParams()) {
    for (const slug of listBlogSlugs()) {
      if (hasBlogPostMessagesForLocale(slug, locale)) {
        params.push({ locale, slug });
      }
    }
  }

  const [{ locale: placeholderLocale }] = generateStaticLocaleParams();
  return ensureStaticExportParams(params, {
    locale: placeholderLocale,
    slug: STATIC_EXPORT_EMPTY_BLOG_SLUG,
  });
}

export async function generateMetadata({
  params,
}: LocalizedBlogPostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);

  if (!hasBlogPostMessagesForLocale(slug, locale)) {
    notFound();
  }

  const published = await getPublishedBlogPostBySlug(slug, { locale });

  if (!published) {
    return {};
  }

  return withPageOpenGraph({
    title: published.messages.title,
    description: published.messages.description,
    alternates: {
      // English canonical only until blog locales ship real translated posts.
      // Unshipped locale variants fail closed above via hasBlogPostMessagesForLocale.
      // App-relative: root metadataBase owns production origin + base path.
      canonical: blogPostHref(slug),
    },
  });
}

export default async function LocalizedBlogPostPage({
  params,
}: LocalizedBlogPostPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveRouteLocaleOrNotFound(rawLocale);

  if (!hasBlogPostMessagesForLocale(slug, locale)) {
    notFound();
  }

  return renderBlogPostPage(slug, locale);
}
