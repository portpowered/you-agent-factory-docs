import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getDocsPageParseCountForTests,
  loadPublishedDocsPages,
  loadPublishedDocsPagesSync,
  resetDocsPageLoadCacheForTests,
} from "./pages";

const cleanupPaths: string[] = [];

beforeEach(() => {
  resetDocsPageLoadCacheForTests();
});

afterEach(() => {
  resetDocsPageLoadCacheForTests();
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createPublishedDocsRoot(slug: string): string {
  const root = mkdtempSync(join(tmpdir(), "pages-load-cache-"));
  cleanupPaths.push(root);
  const pageDir = join(root, "guides", slug);
  mkdirSync(join(pageDir, "messages"), { recursive: true });
  writeFileSync(
    join(pageDir, "page.mdx"),
    `---
kind: "guide"
registryId: "guide.${slug}"
messageNamespace: "local"
assetNamespace: "local"
tags:
  - "attention"
status: "published"
updatedAt: "2026-06-02"
---

# <T k="title" />
`,
    "utf8",
  );
  writeFileSync(
    join(pageDir, "messages", "en.json"),
    `${JSON.stringify({
      title: `Guide ${slug}`,
      description: `Summary for ${slug}`,
    })}\n`,
    "utf8",
  );
  return root;
}

describe("docs page load build-scoped cache", () => {
  test("parses the same docs root at most once per process", async () => {
    const docsRoot = createPublishedDocsRoot("shared-parse");

    const first = await loadPublishedDocsPages("en", docsRoot);
    const second = await loadPublishedDocsPages("en", docsRoot);
    const third = loadPublishedDocsPagesSync("en", docsRoot);

    expect(first).toHaveLength(1);
    expect(first[0]?.docsSlug).toBe("guides/shared-parse");
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(getDocsPageParseCountForTests()).toBe(1);
  });

  test("parses distinct docs roots independently", async () => {
    const firstRoot = createPublishedDocsRoot("first-page");
    const secondRoot = createPublishedDocsRoot("second-page");

    const first = await loadPublishedDocsPages("en", firstRoot);
    const second = await loadPublishedDocsPages("en", secondRoot);

    expect(first[0]?.docsSlug).toBe("guides/first-page");
    expect(second[0]?.docsSlug).toBe("guides/second-page");
    expect(getDocsPageParseCountForTests()).toBe(2);
  });

  test("re-parses after the cache is reset", () => {
    const docsRoot = createPublishedDocsRoot("reset-pages");

    loadPublishedDocsPagesSync("en", docsRoot);
    expect(getDocsPageParseCountForTests()).toBe(1);

    resetDocsPageLoadCacheForTests();
    loadPublishedDocsPagesSync("en", docsRoot);
    expect(getDocsPageParseCountForTests()).toBe(1);
  });
});
