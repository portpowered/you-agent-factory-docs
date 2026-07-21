/**
 * Post-owned shell, narrative, and related-docs proof for blog/lies-damned-lies-evals.
 * Story 001: published shell. Story 002: operational-evidence narrative.
 * Story 003: metrics + concept related links.
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
          "concept.bottlenecks",
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

  test("renders post shell with title, context, DocsDescription, and no Summary chrome", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("A high model benchmark score does not tell you");
    expect(html).toContain("judge workflow health from operational evidence");
    expect(html).not.toContain(">Summary</");
    expect(html).not.toContain(
      "Evaluate agent-factory workflows with live operational signals",
    );
    expect(html).toContain("The wrong scoreboard");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain('href="/docs/documentation/metrics"');
    expect(html).toContain(
      'href="/docs/concepts/statistical-process-control-graphs"',
    );
    expect(html).not.toContain("Give the compact version first");
    expect(html).not.toContain("Created from the blog-post MDX template");
  });
});

describe("lies-damned-lies-evals operational-evidence narrative (002)", () => {
  test("states core claim and contrasts three factory-ops signals with leaderboards", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      "Useful evaluation of agent-factory workflows comes from operational evidence",
    );
    expect(html).toContain("Completions and failures over time");
    expect(html).toContain("Queue or harness saturation");
    expect(html).toContain("Token or context pressure");
    expect(html).toContain("A leaderboard score does not tell you that");
    expect(html).toContain("A leaderboard score does not name that stage");
    expect(html).toContain("A leaderboard score does not show that either");
    expect(html).toContain("you-agent-factory");
    expect(html).not.toContain("Model Atlas");
    expect(html).not.toContain("on this page");
    expect(html).not.toContain("Give the compact version first");
  });
});

describe("lies-damned-lies-evals related factory docs (003)", () => {
  test("frontmatter lists metrics plus SPC and bottlenecks concept ids", async () => {
    const post = await getPublishedBlogPostBySlug(BLOG_SLUG);

    expect(post?.frontmatter.relatedDocIds).toEqual([
      "documentation.metrics",
      "concept.statistical-process-control-graphs",
      "concept.bottlenecks",
    ]);
  });

  test("renders metrics and concept routes as in-prose links without related-docs chrome", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain('href="/docs/documentation/metrics"');
    expect(html).toContain(
      'href="/docs/concepts/statistical-process-control-graphs"',
    );
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    expect(html).toContain("metrics documentation");
    expect(html).toContain("bottlenecks");
    expect(html).toContain('data-testid="blog-next-post"');
    expect(html).toContain('href="/blog/useful-factory-links"');
  });
});
