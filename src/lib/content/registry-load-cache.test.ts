import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getRegistryParseCountForTests,
  loadRegistry,
  resetRegistryLoadCacheForTests,
} from "./registry";

const cleanupPaths: string[] = [];

beforeEach(() => {
  resetRegistryLoadCacheForTests();
});

afterEach(() => {
  resetRegistryLoadCacheForTests();
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createTagOnlyRegistryRoot(slug: string): string {
  const root = mkdtempSync(join(tmpdir(), "registry-load-cache-"));
  cleanupPaths.push(root);
  const tagsRoot = join(root, "tags");
  mkdirSync(tagsRoot, { recursive: true });
  writeFileSync(
    join(tagsRoot, `${slug}.json`),
    `${JSON.stringify(
      {
        id: `tag.${slug}`,
        slug,
        kind: "tag",
        defaultTitleKey: "title",
        defaultSummaryKey: "description",
        aliases: [],
        tags: [],
        relatedIds: [],
        citationIds: [],
        status: "published",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
        category: "module-type",
        landingPage: "generated-tag-page",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return root;
}

describe("loadRegistry build-scoped cache", () => {
  test("parses the same registry root at most once per process", async () => {
    const registryRoot = createTagOnlyRegistryRoot("attention");

    const first = await loadRegistry({ registryRoot });
    const second = await loadRegistry({ registryRoot });

    expect(first.tagsBySlug.get("attention")?.id).toBe("tag.attention");
    expect(second).toBe(first);
    expect(getRegistryParseCountForTests()).toBe(1);
  });

  test("parses distinct registry roots independently", async () => {
    const firstRoot = createTagOnlyRegistryRoot("first-tag");
    const secondRoot = createTagOnlyRegistryRoot("second-tag");

    const first = await loadRegistry({ registryRoot: firstRoot });
    const second = await loadRegistry({ registryRoot: secondRoot });

    expect(first.tagsBySlug.has("first-tag")).toBe(true);
    expect(second.tagsBySlug.has("second-tag")).toBe(true);
    expect(getRegistryParseCountForTests()).toBe(2);
  });

  test("shares one in-flight parse across concurrent callers", async () => {
    const registryRoot = createTagOnlyRegistryRoot("concurrent");

    const [first, second] = await Promise.all([
      loadRegistry({ registryRoot }),
      loadRegistry({ registryRoot }),
    ]);

    expect(first).toBe(second);
    expect(getRegistryParseCountForTests()).toBe(1);
  });

  test("re-parses after the cache is reset", async () => {
    const registryRoot = createTagOnlyRegistryRoot("reset-me");

    await loadRegistry({ registryRoot });
    expect(getRegistryParseCountForTests()).toBe(1);

    resetRegistryLoadCacheForTests();
    await loadRegistry({ registryRoot });
    expect(getRegistryParseCountForTests()).toBe(1);
  });
});
