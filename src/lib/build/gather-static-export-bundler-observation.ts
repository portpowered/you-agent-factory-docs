/**
 * Gathers a correctness-suite observation from a completed (or failed) static
 * export attempt so webpack and Turbopack bake-offs share one evaluator.
 */

import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import { resolveExportSearchBootstrapFilePath } from "@/lib/build/export-search-bootstrap";
import type { StaticExportBundler } from "@/lib/build/static-export-bundler";
import type { StaticExportBundlerCorrectnessObservation } from "@/lib/build/static-export-bundler-correctness";
import { verifyProjectSiteExportDirectory } from "@/lib/build/verify-project-site-export-consumers";

export type GatherStaticExportBundlerObservationOptions = {
  bundler: StaticExportBundler;
  exportCompleted: boolean;
  buildOutput: string;
  cwd?: string;
  outDir?: string;
  basePath?: string;
  cleanWallTimeMs?: number;
};

/**
 * Builds a suite observation from export exit status + `out/` consumer proofs.
 * Missing `out/` yields failed base-path / search checks without throwing.
 */
export function gatherStaticExportBundlerCorrectnessObservation(
  options: GatherStaticExportBundlerObservationOptions,
): StaticExportBundlerCorrectnessObservation {
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const basePath = options.basePath ?? BUILT_APP_GITHUB_PAGES_BASE_PATH;
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  const hasExportOutDirectory = existsSync(absoluteOutDir);

  let basePathContractOk = false;
  let searchBootstrapOk = false;

  if (hasExportOutDirectory) {
    try {
      const consumers = verifyProjectSiteExportDirectory({
        outDir,
        cwd,
        basePath,
      });
      const bootstrapPath = resolveExportSearchBootstrapFilePath(outDir, cwd);
      const bootstrapPresent = existsSync(bootstrapPath);
      basePathContractOk =
        consumers.ok &&
        consumers.evaluation.hasPrefixedNextAssets &&
        !consumers.evaluation.hasRootLevelNextAssets &&
        consumers.evaluation.hasPrefixedNavigation;
      searchBootstrapOk =
        bootstrapPresent &&
        consumers.ok &&
        consumers.evaluation.hasPrefixedSearchBootstrap;
    } catch {
      basePathContractOk = false;
      searchBootstrapOk = false;
    }
  }

  return {
    bundler: options.bundler,
    exportCompleted: options.exportCompleted,
    buildOutput: options.buildOutput,
    hasExportOutDirectory,
    basePathContractOk,
    searchBootstrapOk,
    cleanWallTimeMs: options.cleanWallTimeMs,
  };
}
