import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBrowseIndexPage,
} from "@/app/(site)/site-renderers";
import { BLOG_INDEX_CONTENT_COLUMN_SURFACE } from "@/features/blog/components/BlogIndexPostList";
import { BROWSE_INDEX_CONTENT_COLUMN_SURFACE } from "@/features/docs/components/BrowseIndexPage";
import { bulletlessListClassName } from "@/features/docs/components/list-decoration";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  CONTENT_COLUMN_CONSUMER_SURFACES,
  CONTENT_COLUMN_INSET,
} from "@/lib/layout/content-column-alignment";

/** DocsPage `#nd-page` applies the shared inset tokens (may be non-contiguous). */
function expectSharedContentColumnInset(html: string) {
  expect(html).toContain('id="nd-page"');
  expect(html).toContain("px-4");
  expect(html).toContain("md:px-6");
  expect(html).toContain("xl:px-8");
  expect(CONTENT_COLUMN_INSET.mobile).toBe("1rem");
  expect(CONTENT_COLUMN_INSET.md).toBe("1.5rem");
  expect(CONTENT_COLUMN_INSET.xl).toBe("2rem");
}

describe("/browse and /blog content-column alignment", () => {
  test("registers browse-index and blog-index as shared content-column consumers", () => {
    expect(CONTENT_COLUMN_CONSUMER_SURFACES).toContain(
      BROWSE_INDEX_CONTENT_COLUMN_SURFACE,
    );
    expect(CONTENT_COLUMN_CONSUMER_SURFACES).toContain(
      BLOG_INDEX_CONTENT_COLUMN_SURFACE,
    );
    expect(BROWSE_INDEX_CONTENT_COLUMN_SURFACE).toBe("browse-index");
    expect(BLOG_INDEX_CONTENT_COLUMN_SURFACE).toBe("blog-index");
  });

  test("/browse header and body share DocsPage left edge without list inset drift", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(await renderBrowseIndexPage());

    expectSharedContentColumnInset(html);
    expect(html).toContain(
      `data-content-column-surface="${BROWSE_INDEX_CONTENT_COLUMN_SURFACE}"`,
    );
    expect(html).toContain(`>${messages.browseIndex.title}</h1>`);
    expect(html).toContain(messages.browseIndex.description);
    expect(html).toContain('id="quick-routes"');
    expect(html).toContain(bulletlessListClassName("mt-4"));
    expect(html).toContain(bulletlessListClassName("mt-8"));
    expect(html).toContain("list-none");
    expect(html).toContain("ps-0");
    expect(html).not.toContain("list-disc");
    expect(html).not.toMatch(/(?:^|[\s"'])-m[trblxy]?-/);
  });

  test("/blog header and body share DocsPage left edge without list inset drift", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(await renderBlogIndexPage());

    expectSharedContentColumnInset(html);
    expect(html).toContain(
      `data-content-column-surface="${BLOG_INDEX_CONTENT_COLUMN_SURFACE}"`,
    );
    expect(html).toContain(`>${messages.blogIndex.title}</h1>`);
    expect(html).toContain(messages.blogIndex.description);
    expect(html).toContain(`aria-label="${messages.blogIndex.listLabel}"`);
    expect(html).toContain(bulletlessListClassName("mt-8"));
    expect(html).toContain("list-none");
    expect(html).toContain("ps-0");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("rounded-lg border border-border");
    expect(html).not.toContain("list-disc");
    expect(html).not.toMatch(/(?:^|[\s"'])-m[trblxy]?-/);
  });
});
