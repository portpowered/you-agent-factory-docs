/**
 * Build/server-only emission of the `@you-agent-factory/api` consumed-hash
 * ledger into content-runtime generated output.
 *
 * Runs resolution, membership validation, and format-version gating, then
 * writes a deterministic TypeScript module via `writeFileIfChanged`. Do not
 * import from client/browser UI code.
 */

import { join } from "node:path";
import {
  getGeneratedContentRuntimeRoot,
  getProjectRoot,
} from "@/lib/content/content-paths";
import {
  type WriteFileIfChangedResult,
  writeFileIfChangedSync,
} from "@/lib/content/write-file-if-changed";
import type { ApiPackageArtifactResolverDependencies } from "./api-package-artifact-resolver";
import {
  type ApiPackageConsumedHashLedger,
  buildApiPackageConsumedHashLedger,
  DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS,
  renderApiPackageConsumedHashLedgerModule,
} from "./api-package-consumed-hash-ledger";
import {
  type ApiPackageFormatVersionGateDependencies,
  validateConsumedApiPackageExportFormatVersionsForFamilies,
} from "./api-package-format-version-gate";
import type { ApiPackageManifestMembershipDependencies } from "./api-package-manifest-membership";

export const API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME =
  "api-package-consumed-hash-ledger.generated.ts" as const;

export const API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_RELATIVE_PATH =
  `src/lib/content/generated/${API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME}` as const;

export type ApiPackageConsumedHashLedgerGenerationDependencies =
  ApiPackageFormatVersionGateDependencies & {
    writeFile?: (path: string, contents: string) => WriteFileIfChangedResult;
  };

export type GenerateApiPackageConsumedHashLedgerOptions = {
  /**
   * Public exports to resolve, validate, and record. Defaults to the fixed
   * non-manifest public subpaths used by this acquisition lane.
   */
  requirements?: ReadonlyArray<{
    target: string;
    dependentReferenceFamily: string;
  }>;
  /** Absolute output path for the generated TypeScript module. */
  outputPath?: string;
  projectRoot?: string;
} & ApiPackageConsumedHashLedgerGenerationDependencies;

export type GenerateApiPackageConsumedHashLedgerResult = {
  changed: boolean;
  outputPath: string;
  ledger: ApiPackageConsumedHashLedger;
  source: string;
  entryCount: number;
};

/**
 * Resolve the default absolute path for the consumed-hash ledger module.
 */
export function getApiPackageConsumedHashLedgerOutputPath(
  projectRoot = getProjectRoot(),
): string {
  return join(
    getGeneratedContentRuntimeRoot(projectRoot),
    API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME,
  );
}

/**
 * After successful resolution and validation, emit a deterministic
 * consumed-hash ledger into generated runtime output. Re-running with
 * unchanged package inputs leaves the file bytes untouched.
 */
export function generateApiPackageConsumedHashLedger(
  options: GenerateApiPackageConsumedHashLedgerOptions = {},
): GenerateApiPackageConsumedHashLedgerResult {
  const {
    requirements = DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS,
    projectRoot = getProjectRoot(),
    outputPath = getApiPackageConsumedHashLedgerOutputPath(projectRoot),
    writeFile = writeFileIfChangedSync,
    ...validationDependencies
  } = options;

  const validated = validateConsumedApiPackageExportFormatVersionsForFamilies(
    requirements,
    validationDependencies as ApiPackageArtifactResolverDependencies &
      Pick<ApiPackageManifestMembershipDependencies, "manifest">,
  );

  const ledger = buildApiPackageConsumedHashLedger(validated);
  const source = renderApiPackageConsumedHashLedgerModule(ledger);
  const writeResult = writeFile(outputPath, source);

  return {
    changed: writeResult.changed,
    outputPath: writeResult.path,
    ledger,
    source,
    entryCount: ledger.entries.length,
  };
}
