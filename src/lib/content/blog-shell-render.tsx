import { DocsDescription, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import Link from "next/link";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogPostMeta } from "@/features/blog/components/BlogPostMeta";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  blogPostHref,
  type LoadedBlogPost,
} from "@/lib/content/blog-page-load";

/** Renders blog post shell markup for layout and viewport probes. */
export function renderBlogPostShell(loadedPost: LoadedBlogPost): string {
  const postHref = blogPostHref(loadedPost.slug);

  return renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(
        DocsTitle,
        null,
        createElement(
          Link,
          {
            href: postHref,
            className: "text-inherit no-underline hover:underline",
            "aria-current": "page",
          },
          loadedPost.messages.title,
        ),
      ),
      createElement(DocsDescription, null, loadedPost.messages.description),
      createElement(BlogPostMeta, {
        publishedAt: loadedPost.frontmatter.publishedAt,
        authors: loadedPost.frontmatter.authors,
        tags: loadedPost.frontmatter.tags,
      }),
      createElement(DocsPageProviders, {
        messages: loadedPost.messages,
        assets: loadedPost.assets,
        // biome-ignore lint/correctness/noChildrenProp: third createElement arg conflicts with strict props typing
        children: createElement(
          "article",
          { "data-blog-slug": loadedPost.slug },
          loadedPost.content,
        ),
      }),
    ),
  );
}
