import { describe, expect, test } from "bun:test";
import {
  isLocalDocsPageBundlePath,
  isRoutableLocalDocsPageData,
  shouldExcludeLocalDocsPageFromRouting,
} from "@/lib/content/routable-docs-page";
import { source } from "@/lib/source";

describe("routable local docs pages", () => {
  test("identifies factory collection local docs page bundle paths only", () => {
    expect(isLocalDocsPageBundlePath("guides/getting-started/page.mdx")).toBe(
      true,
    );
    expect(isLocalDocsPageBundlePath("concepts/foo/page.mdx")).toBe(true);
    expect(
      isLocalDocsPageBundlePath("techniques/prompt-caching/page.mdx"),
    ).toBe(true);
    expect(
      isLocalDocsPageBundlePath("documentation/cli-reference/page.mdx"),
    ).toBe(true);
    expect(isLocalDocsPageBundlePath("glossary/token/page.mdx")).toBe(true);
    expect(isLocalDocsPageBundlePath("workers/agent/variant/page.mdx")).toBe(
      true,
    );
    expect(isLocalDocsPageBundlePath("references/openapi/paths/page.mdx")).toBe(
      true,
    );
    expect(
      isLocalDocsPageBundlePath("factories/docs/write-review/page.mdx"),
    ).toBe(true);
    expect(
      isLocalDocsPageBundlePath("workstations/inference/run/page.mdx"),
    ).toBe(true);
    expect(isLocalDocsPageBundlePath("modules/attention/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("models/foo/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("papers/foo/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("training/foo/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("systems/batching/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("getting-started.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("unknown/foo/page.mdx")).toBe(false);
    expect(isLocalDocsPageBundlePath("workers/page.mdx")).toBe(false);
  });

  test("flags draft nested local docs bundles for routing exclusion", () => {
    expect(
      shouldExcludeLocalDocsPageFromRouting("workers/agent/variant/page.mdx", {
        messageNamespace: "local",
        status: "draft",
      }),
    ).toBe(true);
    expect(
      shouldExcludeLocalDocsPageFromRouting("workers/agent/variant/page.mdx", {
        messageNamespace: "local",
        status: "published",
      }),
    ).toBe(false);
  });

  test("requires published status for local message bundles", () => {
    expect(
      isRoutableLocalDocsPageData({
        messageNamespace: "local",
        status: "published",
      }),
    ).toBe(true);
    expect(
      isRoutableLocalDocsPageData({
        messageNamespace: "local",
        status: "draft",
      }),
    ).toBe(false);
    expect(
      isRoutableLocalDocsPageData({
        messageNamespace: "shared",
        status: "draft",
      }),
    ).toBe(true);
  });

  test("flags draft local docs bundles for routing exclusion", () => {
    expect(
      shouldExcludeLocalDocsPageFromRouting("concepts/foo/page.mdx", {
        messageNamespace: "local",
        status: "draft",
      }),
    ).toBe(true);
    expect(
      shouldExcludeLocalDocsPageFromRouting("concepts/foo/page.mdx", {
        messageNamespace: "local",
        status: "published",
      }),
    ).toBe(false);
  });

  test("empty Atlas-cleared collections do not publish deleted page fixtures", () => {
    expect(
      source.getPage(["concepts", "page-spec-workflow-sample"]),
    ).toBeUndefined();
    expect(source.getPage(["glossary", "token"])).toBeUndefined();
    expect(
      source.getPage(["concepts", "transformer-architecture"]),
    ).toBeUndefined();
    expect(source.getPage(["modules", "attention"])).toBeUndefined();

    const slugPaths = source
      .generateParams()
      .map((entry) => entry.slug.join("/"));
    expect(slugPaths).not.toContain("concepts/page-spec-workflow-sample");
    expect(slugPaths).not.toContain("glossary/token");
    expect(slugPaths).not.toContain("modules/attention");

    for (const retired of [
      "models",
      "modules",
      "papers",
      "training",
      "systems",
    ] as const) {
      expect(source.getPage([retired])).toBeUndefined();
      expect(slugPaths).not.toContain(retired);
      expect(
        slugPaths.some(
          (slugPath) =>
            slugPath === retired || slugPath.startsWith(`${retired}/`),
        ),
      ).toBe(false);
    }
  });
});
