import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDocsPageDir } from "@/lib/content/content-paths";
import { findDocsPageDirectories } from "@/lib/content/docs-page-directories";
import {
  loadPublishedDocsPagesSync,
  resetDocsPageLoadCacheForTests,
} from "@/lib/content/pages";

function writeNestedWorkersFixture(docsRoot: string): {
  parentDir: string;
  nestedDir: string;
  twoSegmentGuideDir: string;
} {
  const parentDir = join(docsRoot, "workers", "agent");
  const nestedDir = join(docsRoot, "workers", "agent", "variant");
  const twoSegmentGuideDir = join(docsRoot, "guides", "getting-started");

  for (const pageDir of [parentDir, nestedDir, twoSegmentGuideDir]) {
    mkdirSync(join(pageDir, "messages"), { recursive: true });
  }

  const frontmatter = (
    kind: "documentation" | "guide",
    registryId: string,
  ): string => `---
kind: "${kind}"
registryId: "${registryId}"
messageNamespace: "local"
assetNamespace: "local"
status: "published"
tags: []
updatedAt: "2026-07-18"
---

# Fixture
`;

  const messages = JSON.stringify({
    title: "Nested discovery fixture",
    description: "Test-only nested page for discovery proofs.",
  });

  writeFileSync(
    join(parentDir, "page.mdx"),
    frontmatter("documentation", "documentation.fixture-agent"),
  );
  writeFileSync(join(parentDir, "messages", "en.json"), messages);
  writeFileSync(
    join(nestedDir, "page.mdx"),
    frontmatter("documentation", "documentation.fixture-agent-variant"),
  );
  writeFileSync(join(nestedDir, "messages", "en.json"), messages);
  writeFileSync(
    join(twoSegmentGuideDir, "page.mdx"),
    frontmatter("guide", "guide.fixture-getting-started"),
  );
  writeFileSync(join(twoSegmentGuideDir, "messages", "en.json"), messages);

  return { parentDir, nestedDir, twoSegmentGuideDir };
}

describe("nested docs page directories", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    resetDocsPageLoadCacheForTests();
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("findDocsPageDirectories discovers nested page.mdx under a parent page bundle", () => {
    const docsRoot = mkdtempSync(join(tmpdir(), "nested-docs-dirs-"));
    tempRoots.push(docsRoot);
    const { parentDir, nestedDir, twoSegmentGuideDir } =
      writeNestedWorkersFixture(docsRoot);

    const discovered = findDocsPageDirectories(docsRoot).sort();

    expect(discovered).toEqual(
      [twoSegmentGuideDir, parentDir, nestedDir].sort(),
    );
  });

  test("getDocsPageDir resolves nested slugs under new route families", () => {
    expect(getDocsPageDir("workers", "agent/variant")).toBe(
      join(getDocsPageDir("workers", "agent"), "variant"),
    );
    expect(getDocsPageDir("references", "openapi/paths")).toBe(
      join(getDocsPageDir("references", "openapi"), "paths"),
    );
    expect(getDocsPageDir("factories", "docs/write-review")).toBe(
      join(getDocsPageDir("factories", "docs"), "write-review"),
    );
    expect(getDocsPageDir("workstations", "inference/run")).toBe(
      join(getDocsPageDir("workstations", "inference"), "run"),
    );
  });

  test("loadPublishedDocsPagesSync discovers nested workers fixture and keeps two-segment guides", () => {
    const docsRoot = mkdtempSync(join(tmpdir(), "nested-docs-load-"));
    tempRoots.push(docsRoot);
    const { nestedDir, twoSegmentGuideDir } =
      writeNestedWorkersFixture(docsRoot);

    const pages = loadPublishedDocsPagesSync("en", docsRoot);
    const bySlug = new Map(pages.map((page) => [page.docsSlug, page]));

    expect(bySlug.get("workers/agent")?.pageDir).toBe(
      getDocsPageDir("workers", "agent", docsRoot),
    );
    expect(bySlug.get("workers/agent/variant")?.pageDir).toBe(nestedDir);
    expect(bySlug.get("workers/agent/variant")?.url).toBe(
      "/docs/workers/agent/variant",
    );
    expect(bySlug.get("guides/getting-started")?.pageDir).toBe(
      twoSegmentGuideDir,
    );
    expect(bySlug.has("workers/agent/variant")).toBe(true);
  });
});
