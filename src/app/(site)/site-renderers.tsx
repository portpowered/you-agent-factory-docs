import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeArticle } from "@/components/home/home-article";
import { loadReferencesFamilyFreshnessSummary } from "@/content/docs/references/family-index/load-references-family-freshness";
import { loadReferencesFamilyIndex } from "@/content/docs/references/family-index/load-references-family-index";
import { ReferencesFamilyIndex } from "@/content/docs/references/family-index/ReferencesFamilyIndex";
import {
  BLOG_INDEX_CONTENT_COLUMN_SURFACE,
  BlogIndexPostList,
} from "@/features/blog/components/BlogIndexPostList";
import { BlogPostMeta } from "@/features/blog/components/BlogPostMeta";
import {
  BROWSE_INDEX_CONTENT_COLUMN_SURFACE,
  BrowseIndexPage,
} from "@/features/docs/components/BrowseIndexPage";
import { DocsIndexEmptyState } from "@/features/docs/components/DocsIndexEmptyState";
import { DocsIndexEntryList } from "@/features/docs/components/DocsIndexEntryList";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { FamilyDocsFooterNeighbors } from "@/features/docs/components/FamilyDocsFooterNeighbors";
import { TagResourceList } from "@/features/docs/components/TagResourceList";
import { SearchPagePanelContent } from "@/features/docs/search/SearchPagePanel";
import {
  EMPTY_SEARCH_PAGE_HANDOFF,
  resolveSearchPageHandoff,
} from "@/features/docs/search/search-page-query";
import { TagLandingEmptyState } from "@/features/docs/tags/TagLandingEmptyState";
import { TagSearchHandoff } from "@/features/docs/tags/TagSearchHandoff";
import { TagsIndexList } from "@/features/docs/tags/TagsIndexList";
import { loadPublishedArchitectureEntries } from "@/lib/content/architecture";
import {
  blogPostHref,
  loadBlogPostFromDisk,
} from "@/lib/content/blog-page-load";
import { getPublishedBlogPostBySlug } from "@/lib/content/blog-post-get";
import { listPublishedBlogPosts } from "@/lib/content/blog-post-list";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { resolveFamilyDocsFooterNeighborsForSlug } from "@/lib/content/resolve-family-docs-footer";
import {
  loadTagLandingContext,
  loadTagResourceGroups,
} from "@/lib/content/tag-resources";
import {
  loadPublishedTagIndexEntries,
  loadPublishedTagIndexGroups,
} from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { buildDocsBrowseSections } from "@/lib/docs/browse-collection-sections";
import type { ShellCollectionDefinition } from "@/lib/docs/collection-definition-contract";
import { toDocsIndexEntries } from "@/lib/docs/docs-index-entries";
import {
  type DocsCollectionInput,
  resolveDocsCollectionInput,
  resolveSectionKindCollectionId,
  resolveShellCollectionIndexMessages,
  type SectionIndexFrontmatterKind,
} from "@/lib/docs/section-collection-index";
import {
  buildLocalizedRoute,
  defaultLocale,
  type LocalizedRouteDestination,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { resolveReferenceChromeMessages } from "@/lib/i18n/reference-chrome-labels";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { buildHomeTableOfContents } from "@/lib/navigation/home-page-toc";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";

export type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type BrowseIndexPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type TagLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export type BlogIndexPageOptions = {
  /** Blog content root override for fixture tests (defaults to production `BLOG_ROOT`). */
  blogRoot?: string;
};

export type BlogPostPageOptions = {
  /** Blog content root override for fixture tests (defaults to production `BLOG_ROOT`). */
  blogRoot?: string;
};

export async function renderBlogPostPage(
  slug: string,
  locale: SiteLocale = defaultLocale,
  options: BlogPostPageOptions = {},
) {
  const published = await getPublishedBlogPostBySlug(slug, {
    blogRoot: options.blogRoot,
    locale,
  });

  if (!published) {
    notFound();
  }

  const post = await loadBlogPostFromDisk(slug, locale, {
    blogRoot: options.blogRoot,
  });

  const postHref = blogPostHref(post.slug, locale);

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      toc={post.toc}
    >
      <DocsPageProviders messages={post.messages} assets={post.assets}>
        <DocsTitle>
          <Link
            href={postHref}
            className="text-inherit no-underline hover:underline"
            aria-current="page"
          >
            {post.messages.title}
          </Link>
        </DocsTitle>
        <DocsDescription>{post.messages.description}</DocsDescription>
        <BlogPostMeta
          publishedAt={post.frontmatter.publishedAt}
          authors={post.frontmatter.authors}
          tags={post.frontmatter.tags}
        />
        <DocsBody>
          <article data-blog-slug={post.slug}>{post.content}</article>
        </DocsBody>
      </DocsPageProviders>
    </DocsPage>
  );
}

export async function renderBlogIndexPage(
  locale: SiteLocale = defaultLocale,
  options: BlogIndexPageOptions = {},
) {
  const messages = await loadUiMessages(locale);
  const posts = await listPublishedBlogPosts({
    blogRoot: options.blogRoot,
    locale,
  });
  const { blogIndex } = messages;

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      data-content-column-surface={BLOG_INDEX_CONTENT_COLUMN_SURFACE}
    >
      <DocsTitle>{blogIndex.title}</DocsTitle>
      <DocsDescription>{blogIndex.description}</DocsDescription>
      <DocsBody>
        {posts.length === 0 ? (
          <DocsIndexEmptyState
            title={blogIndex.emptyTitle}
            description={blogIndex.emptyDescription}
            homeLinkLabel={blogIndex.emptyHomeLink}
            messages={messages}
            locale={locale}
          />
        ) : (
          <BlogIndexPostList
            listLabel={blogIndex.listLabel}
            posts={posts.map((post) => ({
              slug: post.slug,
              title: post.messages.title,
              description: post.messages.description,
              publishedAt: post.frontmatter.publishedAt,
              tags: post.frontmatter.tags,
              href: blogPostHref(post.slug, locale),
            }))}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function renderHomePage(locale: SiteLocale = defaultLocale) {
  const messages = await loadUiMessages(locale);
  const { home } = messages;

  return (
    <DocsPage
      toc={buildHomeTableOfContents(home)}
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
    >
      <DocsBody>
        <HomeArticle
          messages={messages}
          siteConfig={youAgentFactorySiteConfig}
          locale={locale}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function renderBrowseIndexPage(
  locale: SiteLocale = defaultLocale,
  _props: BrowseIndexPageProps = {},
) {
  const messages = await loadUiMessages(locale);
  const pages = await loadShippedLocalizedDocsPages(locale);
  const browseSections = buildDocsBrowseSections({
    pages,
    locale,
    messages,
  });

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      data-content-column-surface={BROWSE_INDEX_CONTENT_COLUMN_SURFACE}
    >
      <DocsTitle>{messages.browseIndex.title}</DocsTitle>
      <DocsDescription>{messages.browseIndex.description}</DocsDescription>
      <DocsBody>
        <BrowseIndexPage
          messages={messages}
          locale={locale}
          sections={browseSections}
        />
      </DocsBody>
    </DocsPage>
  );
}

export type ShellSectionCollectionIndexDefinition = Pick<
  ShellCollectionDefinition,
  "routeSlug" | "frontmatterKind" | "messageKeys"
>;

export type ShellSectionCollectionIndexPageInput = {
  definition: ShellSectionCollectionIndexDefinition;
  pages: readonly {
    docsSlug: string;
    url: string;
    messages: { title: string; description: string };
    frontmatter: { kind: string };
  }[];
  messages: Record<string, unknown>;
  locale?: SiteLocale;
  emptyStateMessages: UiMessages;
};

export function renderShellSectionCollectionIndexPage({
  definition,
  pages,
  messages,
  locale = defaultLocale,
  emptyStateMessages,
}: ShellSectionCollectionIndexPageInput) {
  const sectionMessages = resolveShellCollectionIndexMessages(
    messages,
    definition,
  );
  // Filter by route-slug prefix so collections that reuse a frontmatter kind
  // (for example factories/workers/workstations → documentation) stay empty
  // until child pages exist under that family's public route.
  const entries = toDocsIndexEntries(
    pages.filter((page) =>
      page.docsSlug.startsWith(`${definition.routeSlug}/`),
    ),
    locale,
    [],
    Number.POSITIVE_INFINITY,
  );

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{sectionMessages.title}</DocsTitle>
      <DocsDescription>{sectionMessages.description}</DocsDescription>
      <DocsBody>
        {entries.length === 0 ? (
          <DocsIndexEmptyState
            title={sectionMessages.emptyTitle}
            description={sectionMessages.emptyDescription}
            homeLinkLabel={sectionMessages.emptyHomeLink}
            messages={emptyStateMessages}
            locale={locale}
            includeBlogLink
          />
        ) : (
          <DocsIndexEntryList
            entries={entries}
            listLabel={sectionMessages.listLabel}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function renderSectionCollectionIndexPage(
  collection: DocsCollectionInput,
  locale: SiteLocale = defaultLocale,
) {
  const definition = resolveDocsCollectionInput(collection);
  const messages = await loadUiMessages(locale);
  const pages = await loadShippedLocalizedDocsPages(locale);

  return renderShellSectionCollectionIndexPage({
    definition,
    pages,
    messages,
    locale,
    emptyStateMessages: messages,
  });
}

/**
 * Authored `/docs/references` family index: localized introduction,
 * eight-route discoverability cards, and package/version freshness from the
 * public API manifest—owned by the references index lane.
 */
export async function renderReferencesFamilyIndexPage(
  locale: SiteLocale = defaultLocale,
) {
  const uiMessages = await loadUiMessages(locale);
  const referenceChrome = resolveReferenceChromeMessages(uiMessages);
  const index = await loadReferencesFamilyIndex(locale);
  const freshness = loadReferencesFamilyFreshnessSummary();
  const title = index.messages.title || uiMessages.referencesIndex.title;
  const description =
    index.messages.description || uiMessages.referencesIndex.description;
  const familyNeighbors = await resolveFamilyDocsFooterNeighborsForSlug(
    "references",
    locale,
  );

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <DocsPageProviders
          assets={index.assets}
          locale={locale}
          messages={index.messages}
          referenceChrome={referenceChrome}
        >
          <ReferencesFamilyIndex
            chrome={referenceChrome}
            freshness={freshness}
            messages={index.messages}
          />
        </DocsPageProviders>
        {familyNeighbors ? (
          <FamilyDocsFooterNeighbors neighbors={familyNeighbors} />
        ) : null}
      </DocsBody>
    </DocsPage>
  );
}

export async function renderSectionKindIndexPage(
  kind: SectionIndexFrontmatterKind,
  locale: SiteLocale = defaultLocale,
) {
  return renderSectionCollectionIndexPage(
    resolveSectionKindCollectionId(kind),
    locale,
  );
}

export async function renderSearchPage(
  locale: SiteLocale = defaultLocale,
  { searchParams }: SearchPageProps = {},
) {
  const messages = await loadUiMessages(locale);
  const metaByUrl = searchResultMetaMapToRecord(
    await loadSearchResultMetaMap(locale),
  );
  const { searchEntry } = messages;
  const handoff =
    process.env.NEXT_STATIC_EXPORT === "1"
      ? EMPTY_SEARCH_PAGE_HANDOFF
      : resolveSearchPageHandoff(await searchParams);

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{searchEntry.title}</DocsTitle>
      <DocsDescription>{searchEntry.description}</DocsDescription>
      <DocsBody>
        <p className="text-sm text-muted-foreground">
          {searchEntry.canonicalNote}
        </p>
        <SearchPagePanelContent
          messages={messages}
          metaByUrl={metaByUrl}
          handoff={handoff}
          locale={locale}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function renderArchitectureIndexPage(
  locale: SiteLocale = defaultLocale,
) {
  const messages = await loadUiMessages(locale);
  const entries = await loadPublishedArchitectureEntries(locale);
  const { architectureIndex } = messages;

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{architectureIndex.title}</DocsTitle>
      <DocsDescription>{architectureIndex.description}</DocsDescription>
      <DocsBody>
        {entries.length === 0 ? (
          <DocsIndexEmptyState
            title={architectureIndex.emptyTitle}
            description={architectureIndex.emptyDescription}
            homeLinkLabel={architectureIndex.emptyHomeLink}
            messages={messages}
            locale={locale}
            includeBlogLink
          />
        ) : (
          <DocsIndexEntryList
            entries={entries}
            listLabel={architectureIndex.listLabel}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function renderTagsIndexPage(locale: SiteLocale = defaultLocale) {
  const messages = await loadUiMessages(locale);
  const groups = await loadPublishedTagIndexGroups(messages, locale);
  const { tagsIndex } = messages;

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{tagsIndex.title}</DocsTitle>
      <DocsDescription>{tagsIndex.description}</DocsDescription>
      <DocsBody>
        <TagsIndexList groups={groups} listLabel={tagsIndex.listLabel} />
      </DocsBody>
    </DocsPage>
  );
}

export async function renderTagLandingPage(
  { params }: TagLandingPageProps,
  locale: SiteLocale = defaultLocale,
) {
  const { slug } = await params;
  const messages = await loadUiMessages(locale);
  const context = await loadTagLandingContext(slug, messages, locale);

  if (!context) {
    notFound();
  }

  const groups = await loadTagResourceGroups(slug, messages, locale);
  const { tagLanding } = messages;
  const searchQuery = context.slug;

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{context.title}</DocsTitle>
      <DocsDescription>{context.summary}</DocsDescription>
      <DocsBody>
        <p className="text-sm text-muted-foreground">
          <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5">
            {context.categoryLabel}
          </span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TagSearchHandoff
            messages={messages}
            tagSlug={slug}
            searchQuery={searchQuery}
            label={tagLanding.searchHandoff}
          />
          <Link
            href={`${buildLocalizedRoute({ surface: "search" }, locale)}?tag=${encodeURIComponent(slug)}`}
            className="inline-flex items-center rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-ring hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tagLanding.searchEntryLink}
          </Link>
        </div>
        {groups.length === 0 ? (
          <TagLandingEmptyState
            messages={messages}
            tagSlug={slug}
            searchQuery={searchQuery}
            locale={locale}
          />
        ) : (
          <TagResourceList
            groups={groups}
            listLabel={tagLanding.listLabel}
            tagSlug={slug}
            locale={locale}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function buildTagLandingMetadata(
  slug: string,
  locale: SiteLocale = defaultLocale,
) {
  const messages = await loadUiMessages(locale);
  const context = await loadTagLandingContext(slug, messages, locale);

  if (!context) {
    return {
      title: "Tag not found",
    };
  }

  return {
    title: context.title,
    description: context.summary,
    alternates: localizedRouteAlternates({ surface: "tag-page", slug }),
  };
}

export async function buildStaticSurfaceMetadata(
  destination: LocalizedRouteDestination,
  {
    title,
    description,
  }: {
    title: string;
    description: string;
  },
) {
  return {
    title,
    description,
    alternates: localizedRouteAlternates(destination),
  };
}

export async function generateTagLandingStaticParams() {
  const messages = await loadUiMessages();
  const entries = await loadPublishedTagIndexEntries(messages, "en");
  return entries.map((entry) => ({
    slug: entry.slug,
  }));
}
