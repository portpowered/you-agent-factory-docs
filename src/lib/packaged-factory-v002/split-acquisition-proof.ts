/**
 * Combined Batch 1 story 002 acquisition proof:
 * 1) library packages via declared public exports
 * 2) packaged-factories via docs-owned allowlisted filesystem pull
 */

import { rmSync } from "node:fs";
import {
  type CleanConsumerInstallResult,
  installPackagedFactoryV002CleanConsumer,
} from "./clean-consumer-install";
import {
  type PackagedFactoriesFilesystemPullResult,
  pullPackagedFactoriesAllowlistedFiles,
} from "./packaged-factories-filesystem-pull";
import {
  type ProvenPublicExport,
  type PublicExportProofDependencies,
  proveRequiredPublicExportSurface,
} from "./public-export-proof";
import { buildPackagedFactoryV002RequiredPublicExports } from "./required-public-exports";

export type SplitAcquisitionProofResult = {
  consumerDir: string;
  install: CleanConsumerInstallResult;
  libraryExports: ProvenPublicExport[];
  packagedFactoriesPull: PackagedFactoriesFilesystemPullResult;
};

/**
 * Install the five exact 0.0.2 pins once, then prove library exports +
 * packaged-factories allowlisted filesystem pull against the same consumer.
 */
export async function provePackagedFactoryV002SplitAcquisition(
  options: PublicExportProofDependencies & {
    keepOnSuccess?: boolean;
    install?: () => CleanConsumerInstallResult;
  } = {},
): Promise<SplitAcquisitionProofResult> {
  const install =
    options.install?.() ??
    installPackagedFactoryV002CleanConsumer({ keepOnSuccess: true });

  try {
    const libraryExports: ProvenPublicExport[] = [];
    for (const surface of buildPackagedFactoryV002RequiredPublicExports()) {
      libraryExports.push(
        await proveRequiredPublicExportSurface(
          install.consumerDir,
          surface,
          options,
        ),
      );
    }

    const resolveFromConsumer = options.resolveFromConsumer;
    const packagedFactoriesPull = pullPackagedFactoriesAllowlistedFiles(
      install.consumerDir,
      {
        resolvePackageJsonPath:
          resolveFromConsumer === undefined
            ? undefined
            : (consumerDir) =>
                resolveFromConsumer(
                  consumerDir,
                  "@you-agent-factory/packaged-factories/package.json",
                ),
        readTextFile: options.readTextFile,
      },
    );

    const result: SplitAcquisitionProofResult = {
      consumerDir: install.consumerDir,
      install,
      libraryExports,
      packagedFactoriesPull,
    };

    if (!options.keepOnSuccess && options.install === undefined) {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }

    return result;
  } catch (error) {
    if (options.install === undefined) {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
    throw error;
  }
}
