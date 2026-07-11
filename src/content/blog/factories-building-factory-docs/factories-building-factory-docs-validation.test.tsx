/**
 * Bundle validation + Atlas-free isolation proof for
 * /blog/factories-building-factory-docs (story 004).
 * Complements `make validate-data` with observable published-post contracts.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";
import { getPublishedBlogPostBySlug } from "@/lib/content/blog-post-get";
import { BLOG_ROOT } from "@/lib/content/content-paths";
import { PUBLISHED_DOCS_REGISTRY_IDS } from "@/lib/content/published-docs-registry-ids";
import { loadRegistry } from "@/lib/content/registry";

const BLOG_SLUG = "factories-building-factory-docs";
const BLOG_TITLE = "Factories building the factory docs";
const EXPECTED_RELATED_DOC_IDS = [
  "documentation.what-is-you-agent-factory",
  "technique.planner-executor",
  "technique.writer-reviewer",
  "concept.harness",
  "concept.worktree",
  "concept.loop",
  "concept.checklist",
  "concept.task-queue",
] as const;

const ATLAS_FRAGMENTS = [
  "Model Atlas",
  "attention-reference",
  "Learn Language Models",
] as const;

describe("factories-building-factory-docs blog validation (004)", () => {
  test("published bundle resolves tags and relatedDocIds", async () => {
    const post = await getPublishedBlogPostBySlug(BLOG_SLUG);
    const indexes = await loadRegistry();

    expect(post).not.toBeNull();
    expect(post?.frontmatter.status).toBe("published");
    expect(post?.frontmatter.tags).toEqual(["foundations"]);
    expect(post?.frontmatter.relatedDocIds).toEqual([
      ...EXPECTED_RELATED_DOC_IDS,
    ]);

    for (const tag of post?.frontmatter.tags ?? []) {
      expect(indexes.tagsBySlug.has(tag)).toBe(true);
    }

    for (const relatedDocId of post?.frontmatter.relatedDocIds ?? []) {
      expect(PUBLISHED_DOCS_REGISTRY_IDS.has(relatedDocId)).toBe(true);
    }

    expect(post?.messages.title).toBe(BLOG_TITLE);
    for (const fragment of ATLAS_FRAGMENTS) {
      expect(post?.messages.title).not.toContain(fragment);
      expect(post?.messages.description).not.toContain(fragment);
      expect(post?.messages.contextSentence).not.toContain(fragment);
      expect(post?.messages.takeaway).not.toContain(fragment);
    }
  });

  test("ships English-only messages and stays free of Atlas taxonomy in render", async () => {
    const messageFiles = readdirSync(
      join(BLOG_ROOT, BLOG_SLUG, "messages"),
    ).sort();
    expect(messageFiles).toEqual(["en.json"]);

    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("Why this docs site is a factory workload");
    expect(html).toContain("Writer-reviewer before merge");
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("/docs/concepts/worktree");
    expect(html).toContain("/docs/concepts/checklist");
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain("/docs/techniques/planner-executor");
    expect(html).toContain("/docs/techniques/writer-reviewer");

    for (const fragment of ATLAS_FRAGMENTS) {
      expect(html).not.toContain(fragment);
    }
  });
});
