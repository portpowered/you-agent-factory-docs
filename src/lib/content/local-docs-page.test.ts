import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isLocalDocsCatchAllSlug,
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";

function writeNestedWorkersLocalBundle(docsRoot: string): string {
  const nestedDir = join(docsRoot, "workers", "agent", "variant");
  mkdirSync(join(nestedDir, "messages"), { recursive: true });

  writeFileSync(
    join(nestedDir, "page.mdx"),
    `---
kind: "documentation"
registryId: "documentation.fixture-agent-variant"
messageNamespace: "local"
assetNamespace: "local"
status: "published"
tags: []
updatedAt: "2026-07-18"
---

# Nested fixture
`,
  );
  writeFileSync(join(nestedDir, "assets.json"), "{}\n");
  writeFileSync(
    join(nestedDir, "messages", "en.json"),
    JSON.stringify({
      title: "Agent variant fixture",
      description: "Test-only nested workers page for local page-ref proofs.",
    }),
  );

  return nestedDir;
}

describe("parseLocalDocsPageRef nested catch-all slugs", () => {
  test("accepts two-segment and deeper slugs under supported docs sections", () => {
    expect(parseLocalDocsPageRef(["guides", "getting-started"])).toEqual({
      section: "guides",
      slug: "getting-started",
    });
    expect(parseLocalDocsPageRef(["workers", "agent", "variant"])).toEqual({
      section: "workers",
      slug: "agent/variant",
    });
    expect(
      parseLocalDocsPageRef(["references", "openapi", "paths", "list"]),
    ).toEqual({
      section: "references",
      slug: "openapi/paths/list",
    });
    expect(
      parseLocalDocsPageRef(["factories", "docs", "write-review"]),
    ).toEqual({
      section: "factories",
      slug: "docs/write-review",
    });
    expect(parseLocalDocsPageRef(["workstations", "inference", "run"])).toEqual(
      {
        section: "workstations",
        slug: "inference/run",
      },
    );
    expect(isLocalDocsCatchAllSlug(["workers", "agent", "variant"])).toBe(true);
  });

  test("does not misparse one-segment collection indexes as local page refs", () => {
    expect(parseLocalDocsPageRef(["workers"])).toBeNull();
    expect(parseLocalDocsPageRef(["references"])).toBeNull();
    expect(parseLocalDocsPageRef(["guides"])).toBeNull();
    expect(parseLocalDocsPageRef(["concepts"])).toBeNull();
    expect(parseLocalDocsPageRef(undefined)).toBeNull();
    expect(parseLocalDocsPageRef([])).toBeNull();
    expect(isLocalDocsCatchAllSlug(["workers"])).toBe(false);
  });

  test("rejects unsupported catch-all shapes fail-closed", () => {
    expect(parseLocalDocsPageRef(["modules", "attention"])).toBeNull();
    expect(parseLocalDocsPageRef(["models", "gpt-2"])).toBeNull();
    expect(parseLocalDocsPageRef(["unknown", "foo", "bar"])).toBeNull();
    expect(parseLocalDocsPageRef(["workers", ""])).toBeNull();
  });
});

describe("loadLocalDocsPage nested route-family fixtures", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("loads a nested workers page bundle through the local docs path", async () => {
    const docsRoot = mkdtempSync(join(tmpdir(), "nested-local-docs-"));
    tempRoots.push(docsRoot);
    writeNestedWorkersLocalBundle(docsRoot);

    const page = await loadLocalDocsPage(
      { section: "workers", slug: "agent/variant" },
      "en",
      docsRoot,
    );

    expect(page.messages.title).toBe("Agent variant fixture");
    expect(page.messages.description).toContain("nested workers page");
    expect(page.frontmatter.registryId).toBe(
      "documentation.fixture-agent-variant",
    );
  });
});
