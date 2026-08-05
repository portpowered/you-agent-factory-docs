import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  verifyExportOutDirectory,
} from "@/lib/build/export-out-directory";
import {
  type RunStaticExportBuildOptions,
  runStaticExportBuild,
} from "@/lib/build/run-static-export-build";
import { normalizeGitHubPagesBasePath } from "@/lib/build/static-export";
import {
  detectExportBasePathFromHtml,
  exportHtmlReferencesBasePathAssets,
  exportHtmlReferencesRootLevelNextAssets,
} from "@/lib/build/verify-export-base-path";

export type TrustedProjectSiteExportMatch =
  | { matches: true }
  | { matches: false; reason: string };

export type AcquireTrustedProjectSiteExportSource = "reused" | "built";

export type AcquireTrustedProjectSiteExportResult = {
  source: AcquireTrustedProjectSiteExportSource;
  outDir: string;
  basePath: string;
  absoluteOutDir: string;
};

export type StaticExportBuildRunner = (
  options: RunStaticExportBuildOptions,
) => { status: number | null; stderr?: string | null; stdout?: string | null };

export type AcquireTrustedProjectSiteExportOptions = {
  cwd?: string;
  outDir?: string;
  basePath?: string;
  /** When false, never rebuild — fail if the existing export is missing/mismatched. */
  allowBuild?: boolean;
  runBuild?: StaticExportBuildRunner;
};

function resolveAbsoluteOutDir(outDir: string, cwd: string): string {
  return isAbsolute(outDir) ? outDir : join(cwd, outDir);
}

/**
 * Reads `out/index.html` and infers the base path it was built with, so the
 * deploy guard can verify an apex export (`""`) or a project-site export
 * without the caller passing the base path out of band.
 */
export function detectTrustedExportBasePath(options: {
  cwd?: string;
  outDir?: string;
}): { ok: true; basePath: string } | { ok: false; reason: string } {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;

  const directory = verifyExportOutDirectory(outDir, cwd);
  if (!directory.ok) {
    return { ok: false, reason: directory.reason };
  }

  const indexPath = join(resolveAbsoluteOutDir(outDir, cwd), "index.html");
  if (!existsSync(indexPath)) {
    return {
      ok: false,
      reason: `Missing ${join(outDir, "index.html")} — export directory is incomplete.`,
    };
  }

  const detected = detectExportBasePathFromHtml(
    readFileSync(indexPath, "utf8"),
  );
  if (detected === null) {
    return {
      ok: false,
      reason: "export index.html has no _next asset references",
    };
  }

  return { ok: true, basePath: normalizeGitHubPagesBasePath(detected) };
}

/**
 * True when `out/` exists and its home HTML references assets at the expected
 * base path — the project-site prefix when one is configured, or bare `/_next`
 * for an apex export. Used to reuse a validate-job or prior trusted export
 * without paying for another full static export.
 */
export function projectSiteExportMatchesTrustedPrefix(options: {
  cwd?: string;
  outDir?: string;
  basePath?: string;
}): TrustedProjectSiteExportMatch {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;

  const directory = verifyExportOutDirectory(outDir, cwd);
  if (!directory.ok) {
    return { matches: false, reason: directory.reason };
  }

  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);
  const indexPath = join(absoluteOutDir, "index.html");
  if (!existsSync(indexPath)) {
    return {
      matches: false,
      reason: `Missing ${join(outDir, "index.html")} — export directory is incomplete.`,
    };
  }

  const html = readFileSync(indexPath, "utf8");
  const basePath = normalizeGitHubPagesBasePath(
    options.basePath ?? detectExportBasePathFromHtml(html) ?? "",
  );

  if (basePath === "") {
    // Apex export: assets must be root-level, with no project-site prefix left
    // over from a differently-configured build.
    if (!exportHtmlReferencesRootLevelNextAssets(html)) {
      return {
        matches: false,
        reason: "export index.html missing root-level /_next asset references",
      };
    }
    return { matches: true };
  }

  if (!exportHtmlReferencesBasePathAssets(html, basePath)) {
    return {
      matches: false,
      reason: `export index.html missing ${basePath}/_next asset references`,
    };
  }
  if (exportHtmlReferencesRootLevelNextAssets(html)) {
    return {
      matches: false,
      reason: "export index.html references root-level /_next assets",
    };
  }

  return { matches: true };
}

/**
 * Obtains one trusted `out/` to verify: reuse when the existing export already
 * matches the expected base path; otherwise build once (unless
 * `allowBuild: false`).
 *
 * When no `basePath` is given the base path is inferred from the artifact, so
 * both the apex deploy (`""`) and the `/you-agent-factory-docs` project-site
 * lane are verifiable without the caller knowing which one produced `out/`.
 */
export function acquireTrustedProjectSiteExport(
  options: AcquireTrustedProjectSiteExportOptions = {},
): AcquireTrustedProjectSiteExportResult {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const detected = detectTrustedExportBasePath({ cwd, outDir });
  const basePath = normalizeGitHubPagesBasePath(
    options.basePath ?? (detected.ok ? detected.basePath : ""),
  );
  const allowBuild = options.allowBuild ?? true;
  const runBuild = options.runBuild ?? runStaticExportBuild;
  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);

  const existing = projectSiteExportMatchesTrustedPrefix({
    cwd,
    outDir,
    basePath,
  });
  if (existing.matches) {
    return { source: "reused", outDir, basePath, absoluteOutDir };
  }

  if (!allowBuild) {
    throw new Error(
      `trusted project-site export unavailable without rebuild: ${existing.reason}`,
    );
  }

  const buildResult = runBuild({
    cwd,
    env: { GITHUB_PAGES_BASE_PATH: basePath },
  });
  if (buildResult.status !== 0) {
    throw new Error(
      `static export build failed with status ${buildResult.status}: ${buildResult.stderr ?? buildResult.stdout ?? ""}`,
    );
  }

  const afterBuild = projectSiteExportMatchesTrustedPrefix({
    cwd,
    outDir,
    basePath,
  });
  if (!afterBuild.matches) {
    throw new Error(
      `export after build still does not match trusted project-site prefix ${basePath}: ${afterBuild.reason}`,
    );
  }

  return { source: "built", outDir, basePath, absoluteOutDir };
}
