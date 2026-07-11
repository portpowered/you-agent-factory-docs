/**
 * Post-owned shell proof for blog/lies-damned-lies-evals (story 001).
 * Covers published title, context, takeaway, and prepared metrics relatedDocId.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";
import { getPublishedBlogPostBySlug } from "@/lib/content/blog-post-get";

const BLOG_SLUG = "lies-damned-lies-evals";
const BLOG_TITLE = "Lies, damned lies, and evals";

describe("lies-damned-lies-evals blog post shell (001)", () => {
  test("published post loads with factory-eval title and prepared metrics relatedDocId", async () => {
    const post = await getPublishedBlogPostBySlug(BLOG_SLUG);

    expect(post).toMatchObject({
      slug: BLOG_SLUG,
      frontmatter: {
        status: "published",
        relatedDocIds: [
          "documentation.metrics",
          "concept.statistical-process-control-graphs",
        ],
        tags: [],
      },
      messages: {
        title: BLOG_TITLE,
      },
    });
    expect(post?.messages.description).toContain("you-agent-factory");
    expect(post?.messages.description).toContain("operational evidence");
  });

  test("renders post shell with title, context, takeaway, and related docs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("A high model benchmark score does not tell you");
    expect(html).toContain(
      "Evaluate agent-factory workflows with live operational signals",
    );
    expect(html).toContain("The wrong scoreboard");
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain('href="/docs/documentation/metrics"');
    expect(html).toContain(
      'href="/docs/concepts/statistical-process-control-graphs"',
    );
    expect(html).not.toContain("Give the compact version first");
    expect(html).not.toContain("Created from the blog-post MDX template");
  });
});
