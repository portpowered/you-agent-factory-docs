import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  absoluteSitePathToRequestUrl,
  evaluatePagesDeployedArtifactProbes,
  extractNextAssetUrlFromHtml,
  guardPagesDeployedArtifact,
  PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES,
  probePagesDeployedArtifact,
} from "./guard-pages-deployed-artifact";

const BASE = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const BOOTSTRAP = `${BASE}/api/search`;
const CSS_PATH = `${BASE}/_next/static/css/app.css`;
const JS_PATH = `${BASE}/_next/static/chunks/main.js`;

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function makeTempRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(root);
  return root;
}

function prefixedPageHtml(title: string): string {
  return `<html><head>
<link rel="stylesheet" href="${CSS_PATH}"/>
<script src="${JS_PATH}"></script>
</head><body>
<a href="${BASE}/">Home</a>
<a href="${BASE}/docs/guides/getting-started">Getting started</a>
<a href="${BASE}/blog/comparing-agent-factories">Comparing agent factories</a>
<h1>${title}</h1>
</body></html>`;
}

function unprefixedPageHtml(title: string): string {
  return `<html><head>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<script src="/_next/static/chunks/main.js"></script>
</head><body>
<a href="/">Home</a>
<a href="/docs/guides/getting-started">Getting started</a>
<a href="/blog/comparing-agent-factories">Comparing agent factories</a>
<h1>${title}</h1>
</body></html>`;
}

function writeRepairedExport(outDir: string): void {
  mkdirSync(join(outDir, "docs/guides"), { recursive: true });
  mkdirSync(join(outDir, "blog"), { recursive: true });
  mkdirSync(join(outDir, "api"), { recursive: true });
  mkdirSync(join(outDir, "_next/static/css"), { recursive: true });
  mkdirSync(join(outDir, "_next/static/chunks"), { recursive: true });

  writeFileSync(join(outDir, "index.html"), prefixedPageHtml("home"), "utf8");
  writeFileSync(
    join(outDir, "docs/guides/getting-started.html"),
    prefixedPageHtml("getting-started"),
    "utf8",
  );
  writeFileSync(
    join(outDir, "blog/comparing-agent-factories.html"),
    prefixedPageHtml("comparing-agent-factories"),
    "utf8",
  );
  writeFileSync(
    join(outDir, "api/search"),
    JSON.stringify({ type: "advanced", ok: true }),
    "utf8",
  );
  writeFileSync(
    join(outDir, "_next/static/css/app.css"),
    "body{color:#111}",
    "utf8",
  );
  writeFileSync(
    join(outDir, "_next/static/chunks/main.js"),
    `from:"${BOOTSTRAP}",type:"static"`,
    "utf8",
  );
}

function writeUnprefixedExport(outDir: string): void {
  mkdirSync(join(outDir, "docs/guides"), { recursive: true });
  mkdirSync(join(outDir, "blog"), { recursive: true });
  mkdirSync(join(outDir, "api"), { recursive: true });
  mkdirSync(join(outDir, "_next/static/css"), { recursive: true });
  mkdirSync(join(outDir, "_next/static/chunks"), { recursive: true });

  writeFileSync(join(outDir, "index.html"), unprefixedPageHtml("home"), "utf8");
  writeFileSync(
    join(outDir, "docs/guides/getting-started.html"),
    unprefixedPageHtml("getting-started"),
    "utf8",
  );
  writeFileSync(
    join(outDir, "blog/comparing-agent-factories.html"),
    unprefixedPageHtml("comparing-agent-factories"),
    "utf8",
  );
  writeFileSync(
    join(outDir, "api/search"),
    JSON.stringify({ type: "advanced", ok: true }),
    "utf8",
  );
  writeFileSync(
    join(outDir, "_next/static/css/app.css"),
    "body{color:#111}",
    "utf8",
  );
  writeFileSync(
    join(outDir, "_next/static/chunks/main.js"),
    'from:"/api/search",type:"static"',
    "utf8",
  );
}

describe("extractNextAssetUrlFromHtml", () => {
  test("prefers prefixed CSS/JS asset URLs", () => {
    const html = prefixedPageHtml("home");
    expect(extractNextAssetUrlFromHtml(html, "css", BASE)).toBe(CSS_PATH);
    expect(extractNextAssetUrlFromHtml(html, "js", BASE)).toBe(JS_PATH);
  });

  test("falls back to root /_next assets for failure fixtures", () => {
    const html = unprefixedPageHtml("home");
    expect(extractNextAssetUrlFromHtml(html, "css", BASE)).toBe(
      "/_next/static/css/app.css",
    );
    expect(extractNextAssetUrlFromHtml(html, "js", BASE)).toBe(
      "/_next/static/chunks/main.js",
    );
  });
});

describe("absoluteSitePathToRequestUrl", () => {
  test("strips basePath when session baseUrl already includes it", () => {
    expect(
      absoluteSitePathToRequestUrl(
        `http://127.0.0.1:3200${BASE}`,
        BASE,
        CSS_PATH,
      ),
    ).toBe(`http://127.0.0.1:3200${BASE}/_next/static/css/app.css`);
  });
});

describe("evaluatePagesDeployedArtifactProbes", () => {
  test("passes for repaired project-site HTML and chunk content", () => {
    const evaluation = evaluatePagesDeployedArtifactProbes({
      html: prefixedPageHtml("home"),
      jsChunkContent: `from:"${BOOTSTRAP}",type:"static"`,
      basePath: BASE,
      cssAssetUrl: CSS_PATH,
      jsChunkUrl: JS_PATH,
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

  test("fails on unprefixed assets, navigation, or search bootstrap", () => {
    const evaluation = evaluatePagesDeployedArtifactProbes({
      html: unprefixedPageHtml("home"),
      jsChunkContent: 'from:"/api/search",type:"static"',
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

describe("probePagesDeployedArtifact", () => {
  test("passes against a repaired project-site export fixture", async () => {
    const root = makeTempRoot("pages-guard-pass-");
    const outDir = join(root, "out");
    writeRepairedExport(outDir);

    const result = await probePagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
      port: 3210,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.probedRoutes).toEqual([
      ...PAGES_DEPLOYED_ARTIFACT_PROBE_ROUTES,
    ]);
    expect(result.cssAssetUrl).toBe(CSS_PATH);
    expect(result.jsChunkUrl).toBe(JS_PATH);
    expect(result.searchBootstrapUrl).toContain(`${BASE}/api/search`);
    expect(result.evaluation.hasPrefixedNextAssets).toBe(true);
    expect(result.evaluation.hasRootLevelNextAssets).toBe(false);
    expect(result.evaluation.hasPrefixedSearchBootstrap).toBe(true);
  });

  test("passes when prefixed bootstrap is only in a non-entry chunk", async () => {
    const root = makeTempRoot("pages-guard-codesplit-");
    const outDir = join(root, "out");
    writeRepairedExport(outDir);
    // Mimic Next code-splitting: HTML references main.js (no bake); search
    // client bake lives in a separate chunk under _next/static/chunks.
    writeFileSync(
      join(outDir, "_next/static/chunks/main.js"),
      'console.log("entry")',
      "utf8",
    );
    writeFileSync(
      join(outDir, "_next/static/chunks/search-client.js"),
      `function v(){return"${BOOTSTRAP}"}`,
      "utf8",
    );

    const result = await probePagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
      port: 3213,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.evaluation.hasPrefixedSearchBootstrap).toBe(true);
    expect(result.jsChunkUrl).toBe(JS_PATH);
  });

  test("fails against an intentionally unprefixed export fixture", async () => {
    const root = makeTempRoot("pages-guard-fail-");
    const outDir = join(root, "out");
    writeUnprefixedExport(outDir);

    const result = await probePagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
      port: 3211,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toMatch(
      /root-level \/_next|missing .*\/_next|unprefixed|missing representative/i,
    );
    expect(result.evaluation.hasRootLevelNextAssets).toBe(true);
  });

  test("fails when the export directory is missing", async () => {
    const root = makeTempRoot("pages-guard-missing-");
    const result = await probePagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Missing export directory");
    }
  });
});

describe("guardPagesDeployedArtifact", () => {
  test("reuses a matching trusted export and probes without rebuilding", async () => {
    const root = makeTempRoot("pages-guard-reuse-");
    writeRepairedExport(join(root, "out"));

    const result = await guardPagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
      port: 3212,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.acquired.source).toBe("reused");
    expect(result.probe.ok).toBe(true);
    expect(result.probe.evaluation.hasPrefixedNextAssets).toBe(true);
  });

  test("fails without rebuild when the trusted export is missing", async () => {
    const root = makeTempRoot("pages-guard-no-rebuild-");
    const result = await guardPagesDeployedArtifact({
      cwd: root,
      outDir: "out",
      basePath: BASE,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toMatch(
      /unavailable without rebuild|Missing export directory/i,
    );
    expect(result.acquired).toBeUndefined();
  });
});
