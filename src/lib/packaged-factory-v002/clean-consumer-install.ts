/**
 * Disposable temporary-consumer install proof for the packaged-factory 0.0.2
 * family.
 *
 * Creates an isolated directory, writes a clean exact-pin package.json, runs a
 * registry install with no overrides, and reads back each installed package
 * version. Missing or unpublished packages fail closed (non-zero install).
 */

import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertCleanConsumerManifestDocument,
  buildCleanConsumerManifest,
  type CleanConsumerManifest,
} from "./clean-consumer-manifest";
import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  PACKAGED_FACTORY_V002_VERSION,
  type PackagedFactoryV002PackageName,
} from "./five-package-pins";

export type CleanConsumerInstalledVersions = Record<
  PackagedFactoryV002PackageName,
  string
>;

export type CleanConsumerInstallResult = {
  consumerDir: string;
  manifest: CleanConsumerManifest;
  installedVersions: CleanConsumerInstalledVersions;
};

export type CleanConsumerInstallFailure = {
  consumerDir: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export class CleanConsumerInstallError extends Error {
  readonly failure: CleanConsumerInstallFailure;

  constructor(message: string, failure: CleanConsumerInstallFailure) {
    super(message);
    this.name = "CleanConsumerInstallError";
    this.failure = failure;
  }
}

export type CleanConsumerInstallRunner = (args: {
  cwd: string;
}) => SpawnSyncReturns<string>;

const defaultNpmInstallRunner: CleanConsumerInstallRunner = ({ cwd }) =>
  spawnSync(
    "npm",
    [
      "install",
      "--no-package-lock",
      "--ignore-scripts",
      "--no-fund",
      "--no-audit",
    ],
    {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        // Keep the temporary consumer isolated from ambient npm link/workspace
        // redirects.
        npm_config_install_links: "false",
      },
    },
  );

export type TemporaryConsumerPackageJson = {
  name: string;
  private: true;
  version: string;
  dependencies: Record<string, string>;
};

/**
 * Low-level registry install into a disposable consumer directory.
 * Does not enforce the five-package exact-pin contract — callers that need
 * that guarantee should use `installPackagedFactoryV002CleanConsumer`.
 */
export function installTemporaryConsumerDependencies(options: {
  packageJson: TemporaryConsumerPackageJson;
  installRunner?: CleanConsumerInstallRunner;
  keepDirectory?: boolean;
}): { consumerDir: string } {
  const installRunner = options.installRunner ?? defaultNpmInstallRunner;
  const consumerDir = mkdtempSync(
    join(tmpdir(), "packaged-factory-v002-clean-consumer-"),
  );

  try {
    writeFileSync(
      join(consumerDir, "package.json"),
      `${JSON.stringify(options.packageJson, null, 2)}\n`,
      "utf8",
    );

    const install = installRunner({ cwd: consumerDir });
    if (install.status !== 0) {
      throw new CleanConsumerInstallError(
        `Clean consumer install failed closed (exit ${String(install.status)}). Missing or unpublished packages must not be substituted.`,
        {
          consumerDir,
          exitCode: install.status,
          stdout: install.stdout ?? "",
          stderr: install.stderr ?? "",
        },
      );
    }

    if (!options.keepDirectory) {
      rmSync(consumerDir, { recursive: true, force: true });
    }

    return { consumerDir };
  } catch (error) {
    rmSync(consumerDir, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Install the five exact 0.0.2 packages into a disposable temporary consumer
 * and assert each installed package.json reports version 0.0.2.
 */
export function installPackagedFactoryV002CleanConsumer(options?: {
  installRunner?: CleanConsumerInstallRunner;
  keepOnSuccess?: boolean;
}): CleanConsumerInstallResult {
  const manifest = buildCleanConsumerManifest();
  assertCleanConsumerManifestDocument(manifest);

  const installRunner = options?.installRunner ?? defaultNpmInstallRunner;
  const consumerDir = mkdtempSync(
    join(tmpdir(), "packaged-factory-v002-clean-consumer-"),
  );

  try {
    writeFileSync(
      join(consumerDir, "package.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    const writtenManifest = JSON.parse(
      readFileSync(join(consumerDir, "package.json"), "utf8"),
    ) as unknown;
    assertCleanConsumerManifestDocument(writtenManifest);

    const install = installRunner({ cwd: consumerDir });
    if (install.status !== 0) {
      throw new CleanConsumerInstallError(
        `Clean consumer install failed closed (exit ${String(install.status)}). Missing or unpublished packages must not be substituted.`,
        {
          consumerDir,
          exitCode: install.status,
          stdout: install.stdout ?? "",
          stderr: install.stderr ?? "",
        },
      );
    }

    const installedVersions =
      readInstalledPackagedFactoryV002Versions(consumerDir);

    for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
      if (installedVersions[name] !== PACKAGED_FACTORY_V002_VERSION) {
        throw new CleanConsumerInstallError(
          `Installed ${name} reported version ${JSON.stringify(installedVersions[name])}, expected exact "${PACKAGED_FACTORY_V002_VERSION}".`,
          {
            consumerDir,
            exitCode: install.status,
            stdout: install.stdout ?? "",
            stderr: install.stderr ?? "",
          },
        );
      }
    }

    const result: CleanConsumerInstallResult = {
      consumerDir,
      manifest,
      installedVersions,
    };

    if (!options?.keepOnSuccess) {
      rmSync(consumerDir, { recursive: true, force: true });
    }

    return result;
  } catch (error) {
    rmSync(consumerDir, { recursive: true, force: true });
    throw error;
  }
}

export function readInstalledPackagedFactoryV002Versions(
  consumerDir: string,
): CleanConsumerInstalledVersions {
  const installedVersions = {} as CleanConsumerInstalledVersions;

  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    const packageJsonPath = join(
      consumerDir,
      "node_modules",
      ...name.split("/"),
      "package.json",
    );
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version?: unknown;
    };

    if (typeof packageJson.version !== "string") {
      throw new Error(
        `Installed package.json for ${name} is missing a string version field.`,
      );
    }

    installedVersions[name] = packageJson.version;
  }

  return installedVersions;
}
