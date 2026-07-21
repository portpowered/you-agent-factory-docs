import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveNextPublishedBlogPost,
  resolveNextPublishedBlogPostFromList,
} from "./blog-next-post";
import { listPublishedBlogPosts } from "./blog-post-list";

function frontmatterBlock(input: {
  status: "published" | "draft";
  publishedAt: string;
}): string {
  return `---
messageNamespace: "local"
assetNamespace: "local"
publishedAt: "${input.publishedAt}"
updatedAt: "${input.publishedAt}"
authors:
  - "site-team"
tags:
  - example-tag
relatedDocIds:
  - concept.example-concept
status: "${input.status}"
---

# Example Post
`;
}

const validMessages = {
  title: "Example Blog Post",
  description: "A fixture post for next-neighbor tests.",
  contextSentence: "This post exists only in tests.",
  takeaway: "Next neighbors follow newest-first index order.",
};

describe("resolveNextPublishedBlogPostFromList", () => {
  test("returns the following newest-first neighbor", () => {
    const posts = [
      { slug: "newest", messages: { title: "Newest" } },
      { slug: "middle", messages: { title: "Middle" } },
      { slug: "oldest", messages: { title: "Oldest" } },
    ] as const;

    expect(resolveNextPublishedBlogPostFromList("newest", posts)).toEqual({
      slug: "middle",
      title: "Middle",
      href: "/blog/middle",
    });
    expect(resolveNextPublishedBlogPostFromList("middle", posts)).toEqual({
      slug: "oldest",
      title: "Oldest",
      href: "/blog/oldest",
    });
  });

  test("returns null for the last post and for unknown slugs", () => {
    const posts = [{ slug: "only-post", messages: { title: "Only" } }] as const;

    expect(resolveNextPublishedBlogPostFromList("only-post", posts)).toBeNull();
    expect(resolveNextPublishedBlogPostFromList("missing", posts)).toBeNull();
  });

  test("localizes the next href when a non-default locale is provided", () => {
    const posts = [
      { slug: "a", messages: { title: "A" } },
      { slug: "b", messages: { title: "B" } },
    ] as const;

    expect(resolveNextPublishedBlogPostFromList("a", posts, "ja")).toEqual({
      slug: "b",
      title: "B",
      href: "/ja/blog/b",
    });
  });
});

describe("resolveNextPublishedBlogPost", () => {
  let tempRoot: string | undefined;

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  async function writeFixturePost(input: {
    slug: string;
    status: "published" | "draft";
    publishedAt: string;
    title?: string;
  }) {
    if (!tempRoot) {
      tempRoot = await mkdtemp(join(tmpdir(), "blog-next-post-"));
    }

    const pageDir = join(tempRoot, input.slug);
    await mkdir(join(pageDir, "messages"), { recursive: true });
    await writeFile(
      join(pageDir, "page.mdx"),
      frontmatterBlock({
        status: input.status,
        publishedAt: input.publishedAt,
      }),
    );
    await writeFile(
      join(pageDir, "messages", "en.json"),
      JSON.stringify({
        ...validMessages,
        title: input.title ?? `${input.slug} title`,
      }),
    );
  }

  test("follows newest-first published order and skips drafts", async () => {
    await writeFixturePost({
      slug: "older-post",
      status: "published",
      publishedAt: "2026-05-01",
      title: "Older Post",
    });
    await writeFixturePost({
      slug: "newer-post",
      status: "published",
      publishedAt: "2026-06-15",
      title: "Newer Post",
    });
    await writeFixturePost({
      slug: "middle-post",
      status: "published",
      publishedAt: "2026-06-01",
      title: "Middle Post",
    });
    await writeFixturePost({
      slug: "hidden-draft",
      status: "draft",
      publishedAt: "2026-07-01",
      title: "Hidden Draft",
    });

    const posts = await listPublishedBlogPosts({ blogRoot: tempRoot });
    expect(posts.map((post) => post.slug)).toEqual([
      "newer-post",
      "middle-post",
      "older-post",
    ]);

    await expect(
      resolveNextPublishedBlogPost("newer-post", { blogRoot: tempRoot }),
    ).resolves.toEqual({
      slug: "middle-post",
      title: "Middle Post",
      href: "/blog/middle-post",
    });

    await expect(
      resolveNextPublishedBlogPost("older-post", { blogRoot: tempRoot }),
    ).resolves.toBeNull();
  });
});
