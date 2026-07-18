import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { generateStaticParams as generateLocalizedDocsStaticParams } from "@/app/[locale]/docs/[[...slug]]/page";
import { generateStaticParams as generateDefaultDocsStaticParams } from "@/app/docs/[[...slug]]/page";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import DocsNotFound from "@/app/docs/not-found";
import { ensureStaticExportParams } from "@/lib/build/static-export";
import {
  auditStaticExportLegacyCompileGraph,
  SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS,
} from "@/lib/build/static-export-legacy-compile-graph";
import {
  buildDocsCatchAllStaticParamsFromDocsSlugs,
  DIRECT_DOCS_ROUTE_FAMILY_INDEX_APP_PAGE_MARKERS,
  docsSlugToCatchAllStaticParamSlug,
  isDirectDocsRouteFamilyCatchAllSlug,
  isDirectDocsRouteFamilySlug,
  listDirectRouteFamilyNestedDocsSlugs,
  mergeDocsCatchAllStaticParams,
} from "@/lib/content/docs-catch-all-static-params";
import {
  loadPublishedDocsPagesSync,
  loadShippedLocalizedDocsPagesSync,
  resetDocsPageLoadCacheForTests,
} from "@/lib/content/pages";
import { resetDerivedShippedLocalizedDocsManifestCache } from "@/lib/content/shipped-localized-docs.server";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";

const repoRoot = join(import.meta.dir, "../../..");

function expectNotFound(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(
    /notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/,
  );
}

function writeNestedRouteFamilyFixtures(docsRoot: string): string[] {
  const nestedPaths = [
    ["references", "openapi", "paths"],
    ["factories", "docs", "write-review"],
    ["workers", "agent", "variant"],
    ["workstations", "inference", "run"],
  ] as const;

  const docsSlugs: string[] = [];

  for (const segments of nestedPaths) {
    const pageDir = join(docsRoot, ...segments);
    mkdirSync(join(pageDir, "messages"), { recursive: true });
    const docsSlug = segments.join("/");
    docsSlugs.push(docsSlug);

    const kind = segments[0] === "references" ? "reference" : "documentation";
    const registryId =
      segments[0] === "references"
        ? "reference.fixture-openapi-paths"
        : `documentation.fixture-${segments.slice(1).join("-")}`;

    writeFileSync(
      join(pageDir, "page.mdx"),
      `---
kind: "${kind}"
registryId: "${registryId}"
messageNamespace: "local"
assetNamespace: "local"
status: "published"
tags: []
updatedAt: "2026-07-18"
---

# Nested fixture
`,
    );
    writeFileSync(join(pageDir, "assets.json"), "{}\n");
    writeFileSync(
      join(pageDir, "messages", "en.json"),
      JSON.stringify({
        title: `${docsSlug} fixture`,
        description: "Test-only nested route-family page for static params.",
      }),
    );
    writeFileSync(
      join(pageDir, "messages", "ja.json"),
      JSON.stringify({
        title: `${docsSlug} fixture ja`,
        description: "JA nested route-family fixture.",
      }),
    );
  }

  return docsSlugs;
}

describe("docs catch-all static params helpers", () => {
  test("splits nested docs slugs into catch-all param segments", () => {
    expect(docsSlugToCatchAllStaticParamSlug("workers/agent/variant")).toEqual([
      "workers",
      "agent",
      "variant",
    ]);
    expect(
      buildDocsCatchAllStaticParamsFromDocsSlugs([
        "references/openapi/paths",
        "guides/getting-started",
      ]),
    ).toEqual([
      { slug: ["references", "openapi", "paths"] },
      { slug: ["guides", "getting-started"] },
    ]);
  });

  test("identifies direct route-family slugs and nested catch-all shapes", () => {
    for (const id of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      expect(isDirectDocsRouteFamilySlug(id)).toBe(true);
      expect(isDirectDocsRouteFamilySlug(`${id}/child/nested`)).toBe(true);
      expect(isDirectDocsRouteFamilyCatchAllSlug([id, "child", "nested"])).toBe(
        true,
      );
    }
    expect(isDirectDocsRouteFamilySlug("guides/getting-started")).toBe(false);
    expect(isDirectDocsRouteFamilyCatchAllSlug(["concepts", "harness"])).toBe(
      false,
    );
  });

  test("merges catch-all params without duplicating slug paths", () => {
    expect(
      mergeDocsCatchAllStaticParams(
        [{ slug: ["workers", "agent", "variant"] }],
        [
          { slug: ["workers", "agent", "variant"] },
          { slug: ["factories", "docs", "write-review"] },
        ],
      ),
    ).toEqual([
      { slug: ["workers", "agent", "variant"] },
      { slug: ["factories", "docs", "write-review"] },
    ]);
  });
});

describe("W05 route-family static params and not-found", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    resetDocsPageLoadCacheForTests();
    resetDerivedShippedLocalizedDocsManifestCache();
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("static-export compile graph requires the four family index App Router pages", () => {
    for (const marker of DIRECT_DOCS_ROUTE_FAMILY_INDEX_APP_PAGE_MARKERS) {
      expect(SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS).toContain(marker);
    }

    const result = auditStaticExportLegacyCompileGraph({
      projectRoot: repoRoot,
      outDir: join(repoRoot, ".does-not-exist-out"),
    });

    expect(result.ok).toBe(true);
    for (const marker of DIRECT_DOCS_ROUTE_FAMILY_INDEX_APP_PAGE_MARKERS) {
      expect(
        result.appPageModules.some(
          (page) => page === marker || page.endsWith(`/${marker}`),
        ),
      ).toBe(true);
    }
  });

  test("live default generateStaticParams include authored references and workers children and keep empty families empty", () => {
    const defaultParams = generateDefaultDocsStaticParams();
    const defaultPaths = defaultParams.map((entry) =>
      (entry.slug ?? []).join("/"),
    );

    expect(defaultParams.length).toBeGreaterThan(0);
    expect(defaultPaths).not.toContain("__no_docs_pages__");
    expect(defaultPaths).toContain("references/api");

    // W11 published the events reference page under the references family.
    expect(defaultPaths).toContain("references/events");

    // W13 authored Worker variant pages enter the default-locale catch-all
    // compile graph via published-page discovery.
    const workersChildren = defaultPaths.filter((path) =>
      path.startsWith("workers/"),
    );
    expect(workersChildren).toEqual(
      expect.arrayContaining([
        "workers/agent",
        "workers/inference",
        "workers/script",
        "workers/poller",
        "workers/model",
        "workers/hosted",
        "workers/mock",
      ]),
    );

    // Families without authored nested pages still contribute no catch-all
    // children (indexes remain dedicated App Router routes).
    for (const id of ["factories", "workstations"] as const) {
      expect(defaultPaths.some((path) => path.startsWith(`${id}/`))).toBe(
        false,
      );
    }

    // Empty-param static export still emits a placeholder rather than failing.
    expect(
      ensureStaticExportParams(
        [],
        { slug: ["__no_docs_pages__"] },
        {
          NEXT_STATIC_EXPORT: "1",
        },
      ),
    ).toEqual([{ slug: ["__no_docs_pages__"] }]);
  });

  test("live localized generateStaticParams include shipped references/api without unshipped events or workers children", async () => {
    const localizedParams = await generateLocalizedDocsStaticParams();
    expect(localizedParams.length).toBeGreaterThan(0);

    const slugPaths = localizedParams.map((entry) =>
      (entry.slug ?? []).join("/"),
    );
    expect(slugPaths).toContain("references/api");
    // references/events and worker variants currently ship English-only
    // messages, so they do not enter shipped-locale catch-all params yet.
    expect(slugPaths.some((path) => path.startsWith("references/events"))).toBe(
      false,
    );
    for (const id of ["factories", "workers", "workstations"] as const) {
      expect(slugPaths.some((path) => path.startsWith(`${id}/`))).toBe(false);
    }
  });

  test("nested fixtures under each family become catch-all static params for default and shipped locales", () => {
    const docsRoot = mkdtempSync(join(tmpdir(), "route-family-static-"));
    tempRoots.push(docsRoot);
    const nestedSlugs = writeNestedRouteFamilyFixtures(docsRoot);

    const published = loadPublishedDocsPagesSync("en", docsRoot);
    const publishedSlugs = published.map((page) => page.docsSlug);
    expect(listDirectRouteFamilyNestedDocsSlugs(publishedSlugs).sort()).toEqual(
      [...nestedSlugs].sort(),
    );

    const defaultParams =
      buildDocsCatchAllStaticParamsFromDocsSlugs(publishedSlugs);
    for (const docsSlug of nestedSlugs) {
      expect(
        defaultParams.some((entry) => entry.slug.join("/") === docsSlug),
      ).toBe(true);
      expect(entrySegmentsAtLeastThree(docsSlug)).toBe(true);
    }

    const shippedJa = loadShippedLocalizedDocsPagesSync("ja", docsRoot);
    const jaParams = buildDocsCatchAllStaticParamsFromDocsSlugs(
      shippedJa.map((page) => page.docsSlug),
    );
    for (const docsSlug of nestedSlugs) {
      expect(jaParams.some((entry) => entry.slug.join("/") === docsSlug)).toBe(
        true,
      );
    }
  });

  test("invalid nested paths under each family use the docs not-found experience", async () => {
    for (const slug of [
      ["references", "missing", "child"],
      ["factories", "missing", "child"],
      ["workers", "missing", "child"],
      ["workstations", "missing", "child"],
    ] as const) {
      try {
        await renderDocsSlugPage([...slug]);
        throw new Error(`Expected /docs/${slug.join("/")} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }

      try {
        await renderDocsSlugPage([...slug], "ja");
        throw new Error(`Expected /ja/docs/${slug.join("/")} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }
    }

    const html = renderToStaticMarkup(DocsNotFound());
    expect(html).toContain("Page not found");
    expect(html).toContain("Getting Started");
    expect(html).toContain('href="/docs/guides/getting-started"');
  });
});

function entrySegmentsAtLeastThree(docsSlug: string): boolean {
  return docsSlugToCatchAllStaticParamSlug(docsSlug).length >= 3;
}
