/**
 * Closeout story 006 — tip proofs for no-JS useful output, Pages base-path
 * family route URLs, visualizer CSS tokens, and one React Flow stylesheet.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import {
  PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
  PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
  PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
} from "@/lib/packaged-factory-v002/global-css-order";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  PACKAGED_FACTORY_V002_HOST_THEME_PALETTES,
  PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
} from "@/lib/packaged-factory-v002/visualizer-theme-tokens";
import {
  assertPackagedFactoryCloseoutBasePathFamilyRouteUrls,
  assertPackagedFactoryCloseoutNoJsDeepResearch,
  assertPackagedFactoryCloseoutNoJsParentIndex,
  assertPackagedFactoryCloseoutNoJsYoui,
  isPackagedFactoryCloseoutPagesPrefixedExportHtml,
  PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_PURPOSE_SNIPPET,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_USAGE_SNIPPET,
  PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES,
  PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH,
  PackagedFactoryCloseoutExportCssError,
  provePackagedFactoryCloseoutNoJsFromExportDirectory,
  provePackagedFactoryCloseoutOneReactFlowStylesheet,
  provePackagedFactoryCloseoutVisualizerThemeTokens,
  provePackagedFactoryReferenceFamilyCloseoutExportCss,
  provePackagedFactoryReferenceFamilyCloseoutExportCssContract,
} from "./packaged-factory-reference-family-closeout-export-css";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);

function parentIndexFixtureHtml(): string {
  const panels = PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map(
    (slug) =>
      `<section data-packaged-factory-definition="factory-json"><pre data-testid="packaged-factory-definition-${slug}">{"id":"${slug}"}</pre></section>`,
  ).join("\n");
  return `<!doctype html><html><body><script>window.__boot=1</script>${panels}</body></html>`;
}

function deepResearchFixtureHtml(): string {
  return `<!doctype html><html><body>
<script src="/chunk.js"></script>
<h2>Purpose</h2>
<p>${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_PURPOSE_SNIPPET} with specialists.</p>
<h2>Usage</h2>
<pre>${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_USAGE_SNIPPET} "topic"</pre>
<a href="${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime}">JavaScript Runtime</a>
<a href="${PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows}">Dynamic Workflows</a>
</body></html>`;
}

function youiFixtureHtml(): string {
  return `<!doctype html><html><body>
<script>void 0</script>
<section data-youi-showcase="">
  <img alt="Factory graph UI" data-youi-showcase-graph-fallback="" src="/home/factory-graph-ui.png" />
</section>
</body></html>`;
}

describe("packaged-factory-reference-family-closeout export/css (pure)", () => {
  test("locks no-JS routes, Pages base path, and CSS import contract", () => {
    const evidence =
      provePackagedFactoryReferenceFamilyCloseoutExportCssContract();
    expect(evidence.noJsRoutes).toEqual([
      "parent-index",
      "deep-research-child",
      "home-youi",
    ]);
    expect(evidence.basePath).toBe("/you-agent-factory-docs");
    expect(evidence.basePathFamilyRoutes).toEqual([
      "/",
      "/docs/references/packaged-factories-index",
      "/docs/references/packaged-factories-index/goal",
      "/docs/references/packaged-factories-index/deep-research",
    ]);
    expect(evidence.css.componentsStylesImport).toBe(
      PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
    );
    expect(evidence.css.visualizersStylesImport).toBe(
      PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
    );
    expect(evidence.css.forbiddenReactFlowImports).toEqual([
      ...PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
    ]);
    expect(evidence.css.themePalettes).toEqual([
      ...PACKAGED_FACTORY_V002_HOST_THEME_PALETTES,
    ]);
    expect(evidence.css.requiredThemeProperties).toEqual([
      ...PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
    ]);
    expect(PACKAGED_FACTORY_CLOSEOUT_NO_JS_ROUTES).toHaveLength(3);
    expect(PACKAGED_FACTORY_CLOSEOUT_BASE_PATH_FAMILY_ROUTES).toHaveLength(4);
    expect(PACKAGED_FACTORY_CLOSEOUT_PAGES_BASE_PATH).toBe(
      "/you-agent-factory-docs",
    );
  });

  test("no-JS asserts fail closed on blank / missing markers", () => {
    expect(() =>
      assertPackagedFactoryCloseoutNoJsParentIndex(
        "<html><body><script></script></body></html>",
      ),
    ).toThrow(PackagedFactoryCloseoutExportCssError);

    expect(() =>
      assertPackagedFactoryCloseoutNoJsDeepResearch(
        "<html><body><h2>Other</h2></body></html>",
      ),
    ).toThrow(/Purpose/);

    expect(() =>
      assertPackagedFactoryCloseoutNoJsYoui(
        '<html><body><div data-youi-showcase=""></div></body></html>',
      ),
    ).toThrow(/graph-fallback/);
  });

  test("no-JS asserts pass on script-stripped fixtures", () => {
    expect(
      assertPackagedFactoryCloseoutNoJsParentIndex(parentIndexFixtureHtml())
        .usefulOutput,
    ).toBe(true);
    expect(
      assertPackagedFactoryCloseoutNoJsDeepResearch(deepResearchFixtureHtml())
        .routeId,
    ).toBe("deep-research-child");
    expect(
      assertPackagedFactoryCloseoutNoJsYoui(youiFixtureHtml()).scriptsAbsent,
    ).toBe(true);
  });

  test("base-path family route URLs compose under /you-agent-factory-docs", () => {
    expect(assertPackagedFactoryCloseoutBasePathFamilyRouteUrls()).toEqual([
      "/you-agent-factory-docs/",
      "/you-agent-factory-docs/docs/references/packaged-factories-index",
      "/you-agent-factory-docs/docs/references/packaged-factories-index/goal",
      "/you-agent-factory-docs/docs/references/packaged-factories-index/deep-research",
    ]);
    expect(() =>
      assertPackagedFactoryCloseoutBasePathFamilyRouteUrls("/wrong"),
    ).toThrow(/Expected Pages base path/);
  });

  test("Pages-prefixed HTML detector requires prefixed /_next and rejects root /_next", () => {
    expect(
      isPackagedFactoryCloseoutPagesPrefixedExportHtml(
        '<link rel="stylesheet" href="/you-agent-factory-docs/_next/static/css/app.css"/>',
      ),
    ).toBe(true);
    expect(
      isPackagedFactoryCloseoutPagesPrefixedExportHtml(
        '<link rel="stylesheet" href="/_next/static/css/app.css"/>',
      ),
    ).toBe(false);
    expect(
      isPackagedFactoryCloseoutPagesPrefixedExportHtml(
        '<link rel="stylesheet" href="/you-agent-factory-docs/_next/static/css/app.css"/><script src="/_next/static/chunks/main.js"></script>',
      ),
    ).toBe(false);
  });
});

describe("packaged-factory-reference-family-closeout export/css (tip)", () => {
  test("host globals keep one React Flow stylesheet via visualizers CSS", () => {
    const evidence =
      provePackagedFactoryCloseoutOneReactFlowStylesheet(repoRoot);
    expect(evidence.visualizersContainsReactFlowImport).toBe(true);
    expect(evidence.componentsStylesImport).toBe(
      "@you-agent-factory/components/styles.css",
    );
    expect(evidence.visualizersStylesImport).toBe(
      "@you-agent-factory/factory-visualizers/styles.css",
    );
  });

  test("visualizer theme tokens resolve under factory-dark and factory-light", () => {
    const evidence =
      provePackagedFactoryCloseoutVisualizerThemeTokens(repoRoot);
    expect(evidence.themePalettes).toEqual(["factory-dark", "factory-light"]);
    expect(evidence.requiredThemeProperties).toContain("--color-on-surface");
    expect(evidence.requiredThemeProperties).toContain("--color-error");
  });

  test("trusted out/ keeps useful no-JS output on parent index, deep-research, and home Youi", () => {
    if (!existsSync(outDir)) {
      return;
    }
    const evidence = provePackagedFactoryCloseoutNoJsFromExportDirectory({
      cwd: repoRoot,
      outDir: DEFAULT_EXPORT_OUT_DIR,
    });
    expect(evidence.map((entry) => entry.routeId)).toEqual([
      "parent-index",
      "deep-research-child",
      "home-youi",
    ]);
    for (const entry of evidence) {
      expect(entry.scriptsAbsent).toBe(true);
      expect(entry.usefulOutput).toBe(true);
    }
  });

  test("combined tip proof covers CSS + no-JS + base-path URLs without requiring prefixed out/", () => {
    if (!existsSync(outDir)) {
      return;
    }
    const proof = provePackagedFactoryReferenceFamilyCloseoutExportCss({
      cwd: repoRoot,
      proveBasePathExport: false,
    });
    expect(proof.css.visualizersContainsReactFlowImport).toBe(true);
    expect(proof.noJs).toHaveLength(3);
    expect(proof.basePathUrls[0]).toBe("/you-agent-factory-docs/");
    expect(proof.basePathExport).toBeNull();
  });
});
