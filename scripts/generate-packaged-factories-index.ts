/**
 * CLI entrypoint for the packaged-factories-index corpus generator.
 *
 * Usage (from repo root):
 *   bun ./scripts/generate-packaged-factories-index.ts
 */

import { relative } from "node:path";
import { getProjectRoot } from "@/lib/content/content-paths";
import { generatePackagedFactoriesIndex } from "@/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index";

if (import.meta.main) {
  const projectRoot = getProjectRoot();
  const result = generatePackagedFactoriesIndex({ projectRoot });
  const relativeOutputDir = relative(projectRoot, result.outputDir);
  const changeLabel =
    result.changedCount > 0
      ? `updated ${result.changedCount} file(s)`
      : "already current";
  console.log(
    `Packaged-factories index corpus ${changeLabel}: ${relativeOutputDir} (${result.bundle.files.length} artifacts).`,
  );
}
