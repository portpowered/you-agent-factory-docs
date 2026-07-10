import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  acquireTrustedProjectSiteExport,
  projectSiteExportMatchesTrustedPrefix,
} from "./acquire-trusted-project-site-export";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function makeRepoWithOut(indexHtml: string): { cwd: string; outDir: string } {
  const cwd = mkdtempSync(join(tmpdir(), "trusted-export-"));
  tempDirs.push(cwd);
  const outDir = join(cwd, "out");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), indexHtml, "utf8");
  return { cwd, outDir: "out" };
}

const PREFIXED_HOME = `<html><head>
<link rel="stylesheet" href="${BUILT_APP_GITHUB_PAGES_BASE_PATH}/_next/static/css/app.css"/>
<script src="${BUILT_APP_GITHUB_PAGES_BASE_PATH}/_next/static/chunks/main.js"></script>
</head><body>home</body></html>`;

const UNPREFIXED_HOME = `<html><head>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<script src="/_next/static/chunks/main.js"></script>
</head><body>home</body></html>`;

describe("projectSiteExportMatchesTrustedPrefix", () => {
  test("matches a project-site out/ whose index references the prefix", () => {
    const { cwd, outDir } = makeRepoWithOut(PREFIXED_HOME);
    expect(
      projectSiteExportMatchesTrustedPrefix({
        cwd,
        outDir,
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }),
    ).toEqual({ matches: true });
  });

  test("rejects missing out/, empty index, unprefixed assets, and root /_next", () => {
    const missing = mkdtempSync(join(tmpdir(), "trusted-export-missing-"));
    tempDirs.push(missing);
    expect(
      projectSiteExportMatchesTrustedPrefix({
        cwd: missing,
        outDir: "out",
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }).matches,
    ).toBe(false);

    const empty = makeRepoWithOut("");
    expect(
      projectSiteExportMatchesTrustedPrefix({
        cwd: empty.cwd,
        outDir: empty.outDir,
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }).matches,
    ).toBe(false);

    const unprefixed = makeRepoWithOut(UNPREFIXED_HOME);
    const unprefixedMatch = projectSiteExportMatchesTrustedPrefix({
      cwd: unprefixed.cwd,
      outDir: unprefixed.outDir,
      basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
    });
    expect(unprefixedMatch.matches).toBe(false);
    if (!unprefixedMatch.matches) {
      expect(unprefixedMatch.reason).toContain(
        `${BUILT_APP_GITHUB_PAGES_BASE_PATH}/_next`,
      );
    }
  });
});

describe("acquireTrustedProjectSiteExport", () => {
  test("reuses a matching trusted export without invoking build", () => {
    const { cwd, outDir } = makeRepoWithOut(PREFIXED_HOME);
    let buildCalls = 0;

    const result = acquireTrustedProjectSiteExport({
      cwd,
      outDir,
      basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      runBuild: () => {
        buildCalls += 1;
        return { status: 0 };
      },
    });

    expect(result.source).toBe("reused");
    expect(result.basePath).toBe(BUILT_APP_GITHUB_PAGES_BASE_PATH);
    expect(result.outDir).toBe("out");
    expect(result.absoluteOutDir).toBe(join(cwd, "out"));
    expect(buildCalls).toBe(0);
  });

  test("builds once when out/ is missing, then returns built", () => {
    const cwd = mkdtempSync(join(tmpdir(), "trusted-export-build-"));
    tempDirs.push(cwd);
    let buildCalls = 0;

    const result = acquireTrustedProjectSiteExport({
      cwd,
      outDir: "out",
      basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      runBuild: () => {
        buildCalls += 1;
        const outDir = join(cwd, "out");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, "index.html"), PREFIXED_HOME, "utf8");
        return { status: 0 };
      },
    });

    expect(result.source).toBe("built");
    expect(buildCalls).toBe(1);
    expect(
      projectSiteExportMatchesTrustedPrefix({
        cwd,
        outDir: "out",
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      }),
    ).toEqual({ matches: true });
  });

  test("rebuilds once when existing out/ is mismatched (unprefixed)", () => {
    const { cwd, outDir } = makeRepoWithOut(UNPREFIXED_HOME);
    let buildCalls = 0;

    const result = acquireTrustedProjectSiteExport({
      cwd,
      outDir,
      basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
      runBuild: () => {
        buildCalls += 1;
        writeFileSync(join(cwd, "out", "index.html"), PREFIXED_HOME, "utf8");
        return { status: 0 };
      },
    });

    expect(result.source).toBe("built");
    expect(buildCalls).toBe(1);
  });

  test("allowBuild:false fails instead of rebuilding a mismatched export", () => {
    const { cwd, outDir } = makeRepoWithOut(UNPREFIXED_HOME);
    let buildCalls = 0;

    expect(() =>
      acquireTrustedProjectSiteExport({
        cwd,
        outDir,
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
        allowBuild: false,
        runBuild: () => {
          buildCalls += 1;
          return { status: 0 };
        },
      }),
    ).toThrow(/unavailable without rebuild/);
    expect(buildCalls).toBe(0);
  });

  test("throws when the injected build fails", () => {
    const cwd = mkdtempSync(join(tmpdir(), "trusted-export-fail-"));
    tempDirs.push(cwd);

    expect(() =>
      acquireTrustedProjectSiteExport({
        cwd,
        outDir: "out",
        basePath: BUILT_APP_GITHUB_PAGES_BASE_PATH,
        runBuild: () => ({ status: 1, stderr: "boom" }),
      }),
    ).toThrow(/static export build failed with status 1/);
  });
});
