/**
 * Post-owned render proof for blog/changelog (story 001).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "changelog";
const BLOG_TITLE = "you-agent-factory releases and changelog";
const GITHUB_RELEASES_URL =
  "https://github.com/portpowered/you-agent-factory/releases";

describe("changelog blog hub (001)", () => {
  test("renders release hub with version metadata and GitHub Releases link", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`data-blog-slug="${BLOG_SLUG}"`);
    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(
      "When you need to see what changed in you-agent-factory",
    );
    expect(html).toContain(
      "Scan recent you-agent-factory release changes on this hub",
    );

    expect(html).toContain("Full release archive");
    expect(html).toContain(`href="${GITHUB_RELEASES_URL}"`);
    expect(html).toContain("GitHub Releases");

    expect(html).toContain("Recent releases");
    expect(html).toContain("you-agent-factory v0.0.5");
    expect(html).toContain("2026-06-02");
    expect(html).toContain("Version:");
    expect(html).toContain("v0.0.5");
    expect(html).toContain("Released:");
    expect(html).toContain("Configure the factory directly from the website");
    expect(html).toContain(
      "Add CLI support for enumerating work, moving work, submitting work",
    );
    expect(html).toContain(`href="${GITHUB_RELEASES_URL}/tag/v0.0.5"`);

    expect(html).toContain('href="/docs/documentation/install"');
    expect(html).toContain('href="/docs/documentation/cli"');
    expect(html).toContain('href="/docs/documentation/cli-command-index"');
    expect(html).toContain("Quick reach");
    expect(html).toContain("Install documentation");
    expect(html).toContain("CLI documentation");
    expect(html).toContain("CLI command index");
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("blog-related-docs-unavailable");
    expect(html).not.toContain("blog-related-docs-partial-unavailable");
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/concepts/worktree"');
    expect(html).toContain("Freshness ownership");
    expect(html).toContain("Site docs maintainers");
    expect(html).toContain("source of truth");
    expect(html).toContain("GitHub Releases");
    expect(html).toContain(
      "Refresh the hub when a new you-agent-factory product release",
    );
    expect(html).toContain("not automated governance CI");
    expect(html).not.toContain("Give the compact version first");
    expect(html).not.toContain("Created from the blog-post MDX template");
  });
});
