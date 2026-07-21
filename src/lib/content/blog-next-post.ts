import { blogPostHref } from "@/lib/content/blog-page-load";
import {
  type ListPublishedBlogPostsOptions,
  listPublishedBlogPosts,
} from "@/lib/content/blog-post-list";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";

/**
 * Compact next-post destination for published blog chrome.
 * Ordering matches the blog index: newest `publishedAt` first, slug
 * tie-break — "next" is the following entry in that list (typically older).
 */
export type BlogNextPostNeighbor = {
  slug: string;
  title: string;
  href: string;
};

/** Minimal post shape needed to pick the next neighbor title + href. */
export type BlogNextPostListEntry = {
  slug: string;
  messages: { title: string };
};

export type ResolveNextPublishedBlogPostOptions =
  ListPublishedBlogPostsOptions & {
    /** Preloaded published posts (newest-first). Skips a second list load. */
    posts?: ReadonlyArray<BlogNextPostListEntry>;
  };

/**
 * Resolve the next published neighbor for `slug` under the blog index order.
 * Returns `null` when the slug is missing or is last in the ordered set.
 */
export function resolveNextPublishedBlogPostFromList(
  slug: string,
  posts: ReadonlyArray<BlogNextPostListEntry>,
  locale: SiteLocale = defaultLocale,
): BlogNextPostNeighbor | null {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return null;
  }

  const next = posts[index + 1];
  if (!next) {
    return null;
  }

  return {
    slug: next.slug,
    title: next.messages.title,
    href: blogPostHref(next.slug, locale),
  };
}

export async function resolveNextPublishedBlogPost(
  slug: string,
  options: ResolveNextPublishedBlogPostOptions = {},
): Promise<BlogNextPostNeighbor | null> {
  const locale = options.locale ?? defaultLocale;
  const posts =
    options.posts ??
    (await listPublishedBlogPosts({
      blogRoot: options.blogRoot,
      locale,
    }));

  return resolveNextPublishedBlogPostFromList(slug, posts, locale);
}
