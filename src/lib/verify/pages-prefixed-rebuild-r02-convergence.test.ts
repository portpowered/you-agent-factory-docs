/**
 * R02 story 007: lock the Pages-prefixed rebuild + deployed-artifact guard
 * contract on the combined tip. Live gate evidence (prefixed `make build` then
 * `make guard-pages-deployed-artifact` on the same `out/`) lives in
 * docs/internal/processes/repair-convergence-verification-relevant-files.md.
 */
import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  evaluatePagesDeployedArtifactProbes,
  PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS,
  PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES,
} from "@/lib/build/guard-pages-deployed-artifact";
import { resolveExportSearchBootstrapClientFrom } from "@/lib/build/verify-export-search-bootstrap-client-path";

const BASE = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const CSS = `${BASE}/_next/static/css/app.css`;
const JS = `${BASE}/_next/static/chunks/main.js`;
const BOOTSTRAP = resolveExportSearchBootstrapClientFrom(BASE);

function prefixedHtml(): string {
  return `<html><head>
<link rel="stylesheet" href="${CSS}"/>
<script src="${JS}"></script>
</head><body>
<a href="${BASE}/">Home</a>
<a href="${BASE}/docs/guides/getting-started">Getting started</a>
<a href="${BASE}/blog/comparing-agent-factories">Comparing agent factories</a>
</body></html>`;
}

function unprefixedHtml(): string {
  return `<html><head>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<script src="/_next/static/chunks/main.js"></script>
</head><body>
<a href="/">Home</a>
<a href="/docs/guides/getting-started">Getting started</a>
<a href="/blog/comparing-agent-factories">Comparing agent factories</a>
</body></html>`;
}

describe("pages prefixed rebuild R02 convergence", () => {
  test("project-site base path remains /you-agent-factory-docs", () => {
    expect(BUILT_APP_GITHUB_PAGES_BASE_PATH).toBe("/you-agent-factory-docs");
    expect(BOOTSTRAP).toBe("/you-agent-factory-docs/api/search");
  });

  test("deployed-artifact probe inventory covers home, getting-started, and comparing", () => {
    expect([...PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES]).toEqual([
      "/",
      "/docs/guides/getting-started",
      "/blog/comparing-agent-factories",
    ]);
    expect([...PAGES_DEPLOYED_ARTIFACT_PROBE_NAV_HREFS]).toEqual([
      "/",
      "/docs/guides/getting-started",
      "/blog/comparing-agent-factories",
    ]);
  });

  test("evaluatePagesDeployedArtifactProbes accepts prefixed export surfaces", () => {
    const evaluation = evaluatePagesDeployedArtifactProbes({
      html: prefixedHtml(),
      jsChunkContent: `from:"${BOOTSTRAP}",type:"static"`,
      basePath: BASE,
      cssAssetUrl: CSS,
      jsChunkUrl: JS,
    });

    expect(evaluation).toEqual({
      hasPrefixedNextAssets: true,
      hasRootLevelNextAssets: false,
      hasPrefixedNavigation: true,
      hasPrefixedSearchBootstrap: true,
      hasUnprefixedSearchBootstrap: false,
      hasCssAssetUrl: true,
      hasJsChunkUrl: true,
    });
  });

  test("evaluatePagesDeployedArtifactProbes rejects unprefixed export surfaces", () => {
    const evaluation = evaluatePagesDeployedArtifactProbes({
      html: unprefixedHtml(),
      jsChunkContent: `from:"/api/search",type:"static"`,
      basePath: BASE,
      cssAssetUrl: "/_next/static/css/app.css",
      jsChunkUrl: "/_next/static/chunks/main.js",
    });

    expect(evaluation.hasPrefixedNextAssets).toBe(false);
    expect(evaluation.hasRootLevelNextAssets).toBe(true);
    expect(evaluation.hasPrefixedNavigation).toBe(false);
    expect(evaluation.hasPrefixedSearchBootstrap).toBe(false);
    expect(evaluation.hasUnprefixedSearchBootstrap).toBe(true);
    expect(evaluation.hasCssAssetUrl).toBe(false);
    expect(evaluation.hasJsChunkUrl).toBe(false);
  });
});
