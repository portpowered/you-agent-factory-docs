/**
 * Colocated page smoke for /blog/comparing-orchestrators (stories 001–004).
 * Proves title, Intro teaching signal, and matrix region / critical controls.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "comparing-orchestrators";
const BLOG_TITLE = "Comparing orchestrators by feature attributes";
const BLOG_DESCRIPTION =
  "Explore orchestrator tradeoffs across open source, license, hosting, and capabilities—feature-attribute comparison, not a benchmark leaderboard.";

describe("comparing-orchestrators blog page smoke (001–004)", () => {
  test("renders published post shell with title, description, and intro teaching signal", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`data-blog-slug="${BLOG_SLUG}"`);
    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    expect(html).not.toContain(">Summary</");
    expect(html).not.toContain("Created from the blog-post MDX template");
    expect(html).not.toContain("Give the compact version first");

    expect(html).toContain("What an orchestrator is");
    expect(html).toContain("How to read the feature matrix");
    expect(html).toContain("feature attributes");
    expect(html).toContain("ranking of benchmark scores");
    expect(html).toContain("Model Context Protocol (MCP)");
    expect(html).toContain("clear a filter or restore a column");
    expect(html).not.toContain("URL-synced filter state");
    expect(html).not.toContain("enough for a first pass");
    expect(html).not.toContain("should show an accessible empty state");
    expect(html).toContain('href="/blog/comparing-agent-factories"');
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/techniques/planner-executor"');
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("Custom scripts");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
  });

  test("renders page-local matrix composer with transposed registry matrix regions", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain('data-testid="comparing-orchestrators-matrix"');
    expect(html).toContain("data-orchestrator-feature-matrix");
    expect(html).toContain("data-matrix-column-picker");
    expect(html).toContain("Attribute filters");
    expect(html).toContain("Focus column");
    expect(html).toContain("Open source");
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("Custom scripts");
  });

  test("renders Intro, matrix, and NotesList TeachingList in top-to-bottom order", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    const introIdx = html.indexOf("What an orchestrator is");
    const howToReadIdx = html.indexOf("How to read the feature matrix");
    const matrixIdx = html.indexOf(
      'data-testid="comparing-orchestrators-matrix"',
    );
    const notesHeadingIdx = html.indexOf("Reading notes");
    const notesListIdx = html.indexOf(
      'aria-label="Reading notes for comparing orchestrators"',
    );
    const noteTitleIdx = html.indexOf("Planner–executor is the technique page");

    expect(introIdx).toBeGreaterThan(-1);
    expect(howToReadIdx).toBeGreaterThan(introIdx);
    expect(matrixIdx).toBeGreaterThan(howToReadIdx);
    expect(notesHeadingIdx).toBeGreaterThan(matrixIdx);
    expect(notesListIdx).toBeGreaterThan(notesHeadingIdx);
    expect(noteTitleIdx).toBeGreaterThan(notesListIdx);

    expect(html).toContain('data-testid="teaching-list"');
    expect(html).toContain("Registry entries today");
    expect(html).toContain("Feature attributes, not scores");
    expect(html).not.toContain("teaching-ui-lists-harness");
  });
});
