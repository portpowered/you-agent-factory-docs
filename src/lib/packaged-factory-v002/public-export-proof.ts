/**
 * Clean-consumer public-export proof for packaged-factory 0.0.2 Batch 1 library
 * packages (client / factory-replay / factory-visualizers).
 *
 * Installs the five exact pins into a disposable consumer, then resolves each
 * required library surface only through that package's published `exports` map.
 * Missing export-map coverage fails closed — proofs never invent undocumented
 * package-internal paths for these ESM libraries.
 *
 * Packaged-factories@0.0.2 is proven separately via allowlisted filesystem pull
 * (`packaged-factories-filesystem-pull.ts`); absence of its exports map is
 * expected and must not be treated as a library-export failure.
 */

import { readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type CleanConsumerInstallResult,
  installPackagedFactoryV002CleanConsumer,
} from "./clean-consumer-install";
import {
  normalizePackageExportsMap,
  type PackageExportsMap,
  packageExportsMapCoversSubpath,
} from "./export-map-coverage";
import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  type PackagedFactoryV002PackageName,
} from "./five-package-pins";
import {
  buildPackagedFactoryV002RequiredPublicExports,
  type RequiredPublicExportSurface,
} from "./required-public-exports";

export type PublicExportProofCode =
  | "missing-export-map"
  | "missing-export"
  | "resolve-failed"
  | "import-failed"
  | "named-export-missing"
  | "empty-artifact";

export class PublicExportProofError extends Error {
  readonly code: PublicExportProofCode;
  readonly surface: RequiredPublicExportSurface;

  constructor(
    code: PublicExportProofCode,
    message: string,
    surface: RequiredPublicExportSurface,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PublicExportProofError";
    this.code = code;
    this.surface = surface;
  }
}

export type ProvenPublicExport = {
  surface: RequiredPublicExportSurface;
  resolvedUrl: string;
  namedExportsPresent: readonly string[];
};

export type PublicExportProofResult = {
  consumerDir: string;
  install: CleanConsumerInstallResult;
  proven: ProvenPublicExport[];
};

export type PublicExportProofDependencies = {
  /**
   * Resolve a package export specifier from the temporary consumer.
   * Defaults to `createRequire(consumer/package.json).resolve`.
   */
  resolveFromConsumer?: (consumerDir: string, specifier: string) => string;
  /**
   * Dynamically import a resolved module URL/path.
   * Defaults to native `import()`.
   */
  importModule?: (resolvedUrl: string) => Promise<Record<string, unknown>>;
  /**
   * Read a resolved non-JS artifact (CSS / JSON) as UTF-8.
   */
  readTextFile?: (absolutePath: string) => string;
  /**
   * Optional install override for tests.
   */
  install?: () => CleanConsumerInstallResult;
};

function defaultResolveFromConsumer(
  consumerDir: string,
  specifier: string,
): string {
  const require = createRequire(join(consumerDir, "package.json"));
  return require.resolve(specifier);
}

function defaultReadTextFile(absolutePath: string): string {
  return readFileSync(absolutePath, "utf8");
}

async function defaultImportModule(
  resolvedUrl: string,
): Promise<Record<string, unknown>> {
  return (await import(resolvedUrl)) as Record<string, unknown>;
}

export function readInstalledPackageExportsMap(
  consumerDir: string,
  packageName: PackagedFactoryV002PackageName,
): PackageExportsMap | null {
  const packageJsonPath = join(
    consumerDir,
    "node_modules",
    ...packageName.split("/"),
    "package.json",
  );
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    exports?: unknown;
  };
  return normalizePackageExportsMap(packageJson.exports);
}

function assertExportMapCoversSurface(
  exportsMap: PackageExportsMap | null,
  surface: RequiredPublicExportSurface,
): void {
  if (exportsMap === null) {
    throw new PublicExportProofError(
      "missing-export-map",
      `Installed ${surface.packageName} has no published exports map; required surface "${surface.id}" (${surface.specifier}) cannot be proven through declared public exports.`,
      surface,
    );
  }

  if (!packageExportsMapCoversSubpath(exportsMap, surface.exportSubpath)) {
    throw new PublicExportProofError(
      "missing-export",
      `Installed ${surface.packageName} exports map does not declare "${surface.exportSubpath}" required by surface "${surface.id}" (${surface.specifier}).`,
      surface,
    );
  }
}

function toFileUrl(resolvedPath: string): string {
  return pathToFileURL(resolvedPath).href;
}

async function proveJsModuleSurface(
  surface: RequiredPublicExportSurface,
  resolvedPath: string,
  importModule: (resolvedUrl: string) => Promise<Record<string, unknown>>,
): Promise<ProvenPublicExport> {
  const resolvedUrl = toFileUrl(resolvedPath);
  let mod: Record<string, unknown>;
  try {
    mod = await importModule(resolvedUrl);
  } catch (cause) {
    throw new PublicExportProofError(
      "import-failed",
      `Failed to import declared export "${surface.specifier}" for surface "${surface.id}".`,
      surface,
      { cause },
    );
  }

  const namedExportsPresent: string[] = [];
  for (const name of surface.requiredNamedExports) {
    if (!(name in mod)) {
      throw new PublicExportProofError(
        "named-export-missing",
        `Declared export "${surface.specifier}" loaded but is missing required named export "${name}" for surface "${surface.id}".`,
        surface,
      );
    }
    namedExportsPresent.push(name);
  }

  return { surface, resolvedUrl, namedExportsPresent };
}

function proveArtifactSurface(
  surface: RequiredPublicExportSurface,
  resolvedPath: string,
  readTextFile: (absolutePath: string) => string,
): ProvenPublicExport {
  const resolvedUrl = toFileUrl(resolvedPath);
  let text: string;
  try {
    text = readTextFile(resolvedPath);
  } catch (cause) {
    throw new PublicExportProofError(
      "resolve-failed",
      `Declared export "${surface.specifier}" resolved to "${resolvedPath}" but could not be read for surface "${surface.id}".`,
      surface,
      { cause },
    );
  }

  if (text.trim().length === 0) {
    throw new PublicExportProofError(
      "empty-artifact",
      `Declared export "${surface.specifier}" resolved to an empty artifact for surface "${surface.id}".`,
      surface,
    );
  }

  if (
    surface.exportSubpath.endsWith(".json") ||
    surface.exportSubpath === "./manifest"
  ) {
    try {
      JSON.parse(text);
    } catch (cause) {
      throw new PublicExportProofError(
        "import-failed",
        `Declared export "${surface.specifier}" did not parse as JSON for surface "${surface.id}".`,
        surface,
        { cause },
      );
    }
  }

  return { surface, resolvedUrl, namedExportsPresent: [] };
}

/**
 * Prove one required surface against an already-installed clean consumer.
 * Checks the installed package `exports` map before resolving/importing.
 */
export async function proveRequiredPublicExportSurface(
  consumerDir: string,
  surface: RequiredPublicExportSurface,
  dependencies: PublicExportProofDependencies = {},
): Promise<ProvenPublicExport> {
  const packageName = surface.packageName as PackagedFactoryV002PackageName;
  if (
    !(PACKAGED_FACTORY_V002_PACKAGE_NAMES as readonly string[]).includes(
      packageName,
    )
  ) {
    throw new PublicExportProofError(
      "missing-export",
      `Surface "${surface.id}" references unexpected package ${surface.packageName}.`,
      surface,
    );
  }

  const exportsMap = readInstalledPackageExportsMap(consumerDir, packageName);
  assertExportMapCoversSurface(exportsMap, surface);

  const resolveFromConsumer =
    dependencies.resolveFromConsumer ?? defaultResolveFromConsumer;
  const importModule = dependencies.importModule ?? defaultImportModule;
  const readTextFile = dependencies.readTextFile ?? defaultReadTextFile;

  let resolvedPath: string;
  try {
    resolvedPath = resolveFromConsumer(consumerDir, surface.specifier);
  } catch (cause) {
    throw new PublicExportProofError(
      "resolve-failed",
      `Package export resolution failed for declared specifier "${surface.specifier}" (surface "${surface.id}").`,
      surface,
      { cause },
    );
  }

  if (surface.requiredNamedExports.length > 0) {
    return proveJsModuleSurface(surface, resolvedPath, importModule);
  }

  return proveArtifactSurface(surface, resolvedPath, readTextFile);
}

/**
 * Install the five exact 0.0.2 packages into a disposable consumer and prove
 * every required Batch 1 library public-export surface through declared
 * exports only (client / factory-replay / factory-visualizers).
 */
export async function provePackagedFactoryV002PublicExports(
  options: PublicExportProofDependencies & {
    keepOnSuccess?: boolean;
  } = {},
): Promise<PublicExportProofResult> {
  const install =
    options.install?.() ??
    installPackagedFactoryV002CleanConsumer({ keepOnSuccess: true });

  const surfaces = buildPackagedFactoryV002RequiredPublicExports();
  const proven: ProvenPublicExport[] = [];

  try {
    for (const surface of surfaces) {
      proven.push(
        await proveRequiredPublicExportSurface(
          install.consumerDir,
          surface,
          options,
        ),
      );
    }

    const result: PublicExportProofResult = {
      consumerDir: install.consumerDir,
      install,
      proven,
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
