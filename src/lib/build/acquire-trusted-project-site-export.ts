import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
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
 * True when `out/` exists and its home HTML already references the project-site
 * asset prefix (and not bare `/_next`). Used to reuse a validate-job or prior
 * trusted export without paying for another full static export.
 */
export function projectSiteExportMatchesTrustedPrefix(options: {
  cwd?: string;
  outDir?: string;
  basePath?: string;
}): TrustedProjectSiteExportMatch {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const basePath = normalizeGitHubPagesBasePath(
    options.basePath ?? BUILT_APP_GITHUB_PAGES_BASE_PATH,
  );

  if (basePath === "") {
    return {
      matches: false,
      reason: "trusted project-site export requires a non-empty base path",
    };
  }

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
 * Obtains one trusted project-site `out/` for `/you-agent-factory-docs`:
 * reuse when the existing export already matches the prefix; otherwise build
 * once (unless `allowBuild: false`).
 */
export function acquireTrustedProjectSiteExport(
  options: AcquireTrustedProjectSiteExportOptions = {},
): AcquireTrustedProjectSiteExportResult {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const basePath = normalizeGitHubPagesBasePath(
    options.basePath ?? BUILT_APP_GITHUB_PAGES_BASE_PATH,
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
