import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps, ComponentType } from "react";
import { DocsAutoLinkedDescription } from "@/features/docs/components/DocsAutoLinkedDescription";
import { DocsOpeningSummary } from "@/features/docs/components/DocsOpeningSummary";
import { DocsPageBreadcrumb } from "@/features/docs/components/DocsPageBreadcrumb";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { FamilyDocsFooterNeighbors } from "@/features/docs/components/FamilyDocsFooterNeighbors";
import {
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";
import { isDocsPageShippedForLocale } from "@/lib/content/pages";
import { resolveFamilyDocsFooterNeighborsForSlug } from "@/lib/content/resolve-family-docs-footer";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { resolveReferenceChromeMessages } from "@/lib/i18n/reference-chrome-labels";
import { localizedShippedDocsPageAlternates } from "@/lib/i18n/route-locale";
import type { ContentColumnConsumerSurface } from "@/lib/layout/content-column-alignment";
import { withPageOpenGraph } from "@/lib/seo/page-open-graph";
import { getMDXComponents } from "../../../mdx-components";

/**
 * Normal docs pages consume the shared content-column left edge via DocsPage
 * `#nd-page` inset. Wire this surface on the DocsPage container — do not nest
 * another horizontal inset on the article body or fake alignment with
 * negative margins. Sidebar taxonomy and MDX prose stay untouched.
 */
export const DOCS_PAGE_CONTENT_COLUMN_SURFACE =
  "docs-page" as const satisfies ContentColumnConsumerSurface;

type DocsSlugPageBody = ComponentType<{
  components?: Record<string, unknown>;
}>;
type DocsPageProps = ComponentProps<typeof DocsPage>;

type DocsSlugPageData = {
  body: DocsSlugPageBody;
  toc?: DocsPageProps["toc"];
  full?: DocsPageProps["full"];
  title?: string;
  description?: string;
};

async function loadDocsSource() {
  const { source } = await import("@/lib/source");
  return source;
}

async function renderLocalDocsPage(
  slug: string[] | undefined,
  locale: SiteLocale,
) {
  const localRef = parseLocalDocsPageRef(slug);
  if (!localRef) {
    return null;
  }

  const source = await loadDocsSource();
  const page = source.getPage(slug);
  if (!page) {
    return null;
  }

  const loadedPage = await loadLocalDocsPage(localRef, locale);
  const uiMessages = await loadUiMessages(locale);
  const docsSlug = slug?.join("/") ?? "";
  const familyNeighbors = docsSlug
    ? await resolveFamilyDocsFooterNeighborsForSlug(docsSlug, locale)
    : undefined;
  const description =
    localRef.section === "glossary" ? (
      <DocsAutoLinkedDescription text={loadedPage.messages.description} />
    ) : (
      loadedPage.messages.description
    );

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      toc={loadedPage.toc}
      data-content-column-surface={DOCS_PAGE_CONTENT_COLUMN_SURFACE}
    >
      <DocsPageProviders
        messages={loadedPage.messages}
        assets={loadedPage.assets}
        locale={locale}
        referenceChrome={resolveReferenceChromeMessages(uiMessages)}
      >
        <DocsPageBreadcrumb
          locale={locale}
          messages={uiMessages}
          slug={slug}
          title={loadedPage.messages.title}
        />
        <DocsTitle>{loadedPage.messages.title}</DocsTitle>
        <DocsDescription>{description}</DocsDescription>
        <DocsBody>
          {localRef.section !== "glossary" ? (
            <DocsOpeningSummary
              text={loadedPage.messages.openingSummary ?? ""}
            />
          ) : null}
          <article data-registry-id={loadedPage.frontmatter.registryId}>
            {loadedPage.content}
          </article>
          {familyNeighbors ? (
            <FamilyDocsFooterNeighbors neighbors={familyNeighbors} />
          ) : null}
        </DocsBody>
      </DocsPageProviders>
    </DocsPage>
  );
}

export async function renderDocsSlugPage(
  slug: string[] | undefined,
  locale: SiteLocale = defaultLocale,
) {
  const docsSlug = slug?.join("/");
  if (docsSlug && !isDocsPageShippedForLocale(docsSlug, locale)) {
    notFound();
  }

  const localPage = await renderLocalDocsPage(slug, locale);
  if (localPage) {
    return localPage;
  }

  const source = await loadDocsSource();
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const docsPageData = page.data as typeof page.data & DocsSlugPageData;
  const MDXContent = docsPageData.body;
  const pageTitle = docsPageData.title;
  if (!pageTitle) {
    notFound();
  }
  const uiMessages = await loadUiMessages(locale);
  const familyNeighbors = docsSlug
    ? await resolveFamilyDocsFooterNeighborsForSlug(docsSlug, locale)
    : undefined;

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      toc={docsPageData.toc}
      full={docsPageData.full}
      data-content-column-surface={DOCS_PAGE_CONTENT_COLUMN_SURFACE}
    >
      <DocsPageBreadcrumb
        locale={locale}
        messages={uiMessages}
        slug={slug}
        title={pageTitle}
      />
      <DocsTitle>{pageTitle}</DocsTitle>
      <DocsDescription>{docsPageData.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
        {familyNeighbors ? (
          <FamilyDocsFooterNeighbors neighbors={familyNeighbors} />
        ) : null}
      </DocsBody>
    </DocsPage>
  );
}

export async function buildDocsPageMetadata(
  slug: string[] | undefined,
  locale: SiteLocale = defaultLocale,
): Promise<Metadata> {
  const docsSlug = slug?.join("/");
  if (docsSlug && !isDocsPageShippedForLocale(docsSlug, locale)) {
    notFound();
  }

  const localRef = parseLocalDocsPageRef(slug);

  if (localRef) {
    const source = await loadDocsSource();
    const page = source.getPage(slug);
    if (page && docsSlug) {
      const loadedPage = await loadLocalDocsPage(localRef, locale);
      return withPageOpenGraph({
        title: loadedPage.messages.title,
        description: loadedPage.messages.description,
        alternates: localizedShippedDocsPageAlternates(docsSlug),
      });
    }
  }

  const source = await loadDocsSource();
  const page = source.getPage(slug);

  if (!page) {
    return {
      title: "Page not found",
    };
  }

  const title = page.data.title ?? "Page not found";
  const description = page.data.description ?? "";

  if (!docsSlug) {
    return {
      title,
      description,
    };
  }

  return withPageOpenGraph({
    title,
    description,
    alternates: localizedShippedDocsPageAlternates(docsSlug),
  });
}
