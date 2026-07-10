import { describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveShippedLocalizedDocsManifest } from "./shipped-localized-docs";
import {
  deriveShippedLocalizedDocsManifest,
  resetDerivedShippedLocalizedDocsManifestCache,
} from "./shipped-localized-docs.server";

async function writePageBundle(
  docsRoot: string,
  slug: string,
  options: {
    status: "published" | "draft";
    locales: string[];
  },
) {
  const pageDir = join(docsRoot, slug);
  await mkdir(join(pageDir, "messages"), { recursive: true });
  await writeFile(
    join(pageDir, "page.mdx"),
    `---
kind: concept
registryId: concept.${slug.replace(/\//g, ".")}
messageNamespace: local
assetNamespace: local
tags:
  - attention
status: ${options.status}
updatedAt: 2026-06-19
---
`,
  );
  await writeFile(
    join(pageDir, "messages", "en.json"),
    JSON.stringify({
      title: slug,
      description: `${slug} description`,
    }),
  );

  for (const locale of options.locales) {
    await writeFile(
      join(pageDir, "messages", `${locale}.json`),
      JSON.stringify({
        title: `${slug} ${locale}`,
        description: `${slug} description ${locale}`,
      }),
    );
  }
}

describe("deriveShippedLocalizedDocsManifest", () => {
  test(
    "includes only published docs pages with colocated non-default locale messages",
    async () => {
      const tempRoot = join(
        import.meta.dir,
        "__shipped-localized-docs-fixtures__",
        crypto.randomUUID(),
        "docs",
      );
      await mkdir(tempRoot, { recursive: true });

      try {
        await writePageBundle(tempRoot, "concepts/translated-page", {
          status: "published",
          locales: ["vi"],
        });
        await writePageBundle(tempRoot, "concepts/default-only-page", {
          status: "published",
          locales: [],
        });
        await writePageBundle(tempRoot, "concepts/draft-translated-page", {
          status: "draft",
          locales: ["vi", "ja"],
        });
        await writePageBundle(tempRoot, "modules/japanese-page", {
          status: "published",
          locales: ["ja"],
        });
        await writePageBundle(tempRoot, "modules/chinese-page", {
          status: "published",
          locales: ["zh-CN"],
        });

        resetDerivedShippedLocalizedDocsManifestCache();
        expect(deriveShippedLocalizedDocsManifest(tempRoot)).toEqual({
          ja: ["modules/japanese-page"],
          "zh-CN": ["modules/chinese-page"],
          vi: ["concepts/translated-page"],
        });
      } finally {
        resetDerivedShippedLocalizedDocsManifestCache();
        await rm(join(import.meta.dir, "__shipped-localized-docs-fixtures__"), {
          recursive: true,
          force: true,
        });
      }
    },
    { timeout: 15_000 },
  );

  test("treats an empty zh-CN shipped-docs list as valid when no Chinese page messages exist", async () => {
    const tempRoot = join(
      import.meta.dir,
      "__shipped-localized-docs-fixtures__",
      crypto.randomUUID(),
      "docs",
    );
    await mkdir(tempRoot, { recursive: true });

    try {
      await writePageBundle(tempRoot, "concepts/english-only", {
        status: "published",
        locales: [],
      });
      await writePageBundle(tempRoot, "modules/japanese-only", {
        status: "published",
        locales: ["ja"],
      });

      resetDerivedShippedLocalizedDocsManifestCache();
      const manifest = deriveShippedLocalizedDocsManifest(tempRoot);
      expect(manifest["zh-CN"]).toEqual([]);
      expect(manifest.ja).toEqual(["modules/japanese-only"]);
      expect(manifest.vi).toEqual([]);
    } finally {
      resetDerivedShippedLocalizedDocsManifestCache();
      await rm(join(import.meta.dir, "__shipped-localized-docs-fixtures__"), {
        recursive: true,
        force: true,
      });
    }
  });

  test("generated shipped localized docs artifact matches the committed docs tree", () => {
    resetDerivedShippedLocalizedDocsManifestCache();
    const derived = deriveShippedLocalizedDocsManifest();
    expect(derived).toEqual(resolveShippedLocalizedDocsManifest());
    expect(derived).toEqual({
      ja: [
        "concepts/checklist",
        "concepts/harness",
        "concepts/loop",
        "concepts/statistical-process-control-graphs",
        "concepts/tokens",
        "concepts/tool",
        "concepts/worktree",
        "documentation/install",
        "documentation/what-is-you-agent-factory",
        "guides/cursor-dynamic-workflows",
        "guides/getting-started",
        "guides/using-you-agent-factory-for-loops",
        "guides/write-review-loops",
      ],
      "zh-CN": [
        "concepts/checklist",
        "concepts/harness",
        "concepts/loop",
        "concepts/statistical-process-control-graphs",
        "concepts/tokens",
        "concepts/tool",
        "concepts/worktree",
        "documentation/install",
        "documentation/what-is-you-agent-factory",
        "guides/cursor-dynamic-workflows",
        "guides/getting-started",
        "guides/using-you-agent-factory-for-loops",
        "guides/write-review-loops",
      ],
      vi: [
        "concepts/checklist",
        "concepts/harness",
        "concepts/loop",
        "concepts/statistical-process-control-graphs",
        "concepts/tokens",
        "concepts/tool",
        "concepts/worktree",
        "documentation/install",
        "documentation/what-is-you-agent-factory",
        "guides/cursor-dynamic-workflows",
        "guides/getting-started",
        "guides/using-you-agent-factory-for-loops",
        "guides/write-review-loops",
      ],
    });
  });
});
