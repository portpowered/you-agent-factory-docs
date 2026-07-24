/**
 * Direct allowlisted filesystem pull for
 * `@you-agent-factory/packaged-factories@0.0.2`.
 *
 * Resolves the installed package root via `package.json`, reads only
 * docs-owned allowlisted relative paths under that root, and fails closed when
 * a required file is missing/unreadable or the installed version is not exact
 * `0.0.2`. Absence of an `exports` map is expected and must not fail.
 *
 * Does not invent fake export maps, does not execute packaged JS, and does not
 * parse companion scripts into derived models.
 */

import {
  existsSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, normalize, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type CleanConsumerInstallResult,
  installPackagedFactoryV002CleanConsumer,
} from "./clean-consumer-install";
import { PACKAGED_FACTORY_V002_VERSION } from "./five-package-pins";
import {
  isPackagedFactoriesAllowlistedRelativePath,
  PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS,
  PACKAGED_FACTORIES_PACKAGE_NAME,
  PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
  type PackagedFactoriesAllowlistedRelativePath,
} from "./packaged-factories-allowlist";

export type PackagedFactoriesFilesystemPullErrorCode =
  | "wrong-version"
  | "package-root-unresolved"
  | "path-not-allowlisted"
  | "path-escapes-package-root"
  | "missing-allowlisted-file"
  | "unreadable-allowlisted-file"
  | "empty-allowlisted-file";

export class PackagedFactoriesFilesystemPullError extends Error {
  readonly code: PackagedFactoriesFilesystemPullErrorCode;
  readonly relativePath?: string;

  constructor(
    code: PackagedFactoriesFilesystemPullErrorCode,
    message: string,
    options?: { relativePath?: string; cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoriesFilesystemPullError";
    this.code = code;
    this.relativePath = options?.relativePath;
  }
}

export type PulledPackagedFactoriesFile = {
  relativePath: PackagedFactoriesAllowlistedRelativePath;
  absolutePath: string;
  /** UTF-8 file bytes. Companion `.js` files are read as text only — never executed. */
  text: string;
  optional: boolean;
};

export type PackagedFactoriesFilesystemPullResult = {
  packageRoot: string;
  installedVersion: string;
  /** True when the installed package.json has no `exports` field (expected at 0.0.2). */
  exportsMapAbsent: boolean;
  required: PulledPackagedFactoriesFile[];
  optionalPresent: PulledPackagedFactoriesFile[];
};

export type PackagedFactoriesFilesystemPullDependencies = {
  resolvePackageJsonPath?: (consumerDir: string) => string;
  readTextFile?: (absolutePath: string) => string;
  pathExists?: (absolutePath: string) => boolean;
  realpath?: (absolutePath: string) => string;
  install?: () => CleanConsumerInstallResult;
};

function defaultResolvePackageJsonPath(consumerDir: string): string {
  const require = createRequire(join(consumerDir, "package.json"));
  return require.resolve(`${PACKAGED_FACTORIES_PACKAGE_NAME}/package.json`);
}

function defaultReadTextFile(absolutePath: string): string {
  return readFileSync(absolutePath, "utf8");
}

function defaultPathExists(absolutePath: string): boolean {
  return existsSync(absolutePath);
}

function defaultRealpath(absolutePath: string): string {
  return realpathSync(absolutePath);
}

/**
 * Resolve the installed packaged-factories package root from a consumer that
 * already has the package in `node_modules`.
 */
export function resolveInstalledPackagedFactoriesPackageRoot(
  consumerDir: string,
  dependencies: PackagedFactoriesFilesystemPullDependencies = {},
): {
  packageRoot: string;
  packageJsonPath: string;
  installedVersion: string;
  exportsMapAbsent: boolean;
} {
  const resolvePackageJsonPath =
    dependencies.resolvePackageJsonPath ?? defaultResolvePackageJsonPath;
  const readTextFile = dependencies.readTextFile ?? defaultReadTextFile;

  let packageJsonPath: string;
  try {
    packageJsonPath = resolvePackageJsonPath(consumerDir);
  } catch (cause) {
    throw new PackagedFactoriesFilesystemPullError(
      "package-root-unresolved",
      `Could not resolve ${PACKAGED_FACTORIES_PACKAGE_NAME}/package.json from consumer "${consumerDir}".`,
      { cause },
    );
  }

  let packageJson: { name?: unknown; version?: unknown; exports?: unknown };
  try {
    packageJson = JSON.parse(readTextFile(packageJsonPath)) as {
      name?: unknown;
      version?: unknown;
      exports?: unknown;
    };
  } catch (cause) {
    throw new PackagedFactoriesFilesystemPullError(
      "package-root-unresolved",
      `Could not read installed ${PACKAGED_FACTORIES_PACKAGE_NAME} package.json at "${packageJsonPath}".`,
      { cause },
    );
  }

  if (packageJson.name !== PACKAGED_FACTORIES_PACKAGE_NAME) {
    throw new PackagedFactoriesFilesystemPullError(
      "package-root-unresolved",
      `Resolved package.json name ${JSON.stringify(packageJson.name)} does not match ${PACKAGED_FACTORIES_PACKAGE_NAME}.`,
    );
  }

  if (typeof packageJson.version !== "string") {
    throw new PackagedFactoriesFilesystemPullError(
      "wrong-version",
      `Installed ${PACKAGED_FACTORIES_PACKAGE_NAME} package.json is missing a string version field.`,
    );
  }

  if (packageJson.version !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoriesFilesystemPullError(
      "wrong-version",
      `Installed ${PACKAGED_FACTORIES_PACKAGE_NAME} reported version ${JSON.stringify(packageJson.version)}, expected exact "${PACKAGED_FACTORY_V002_VERSION}".`,
    );
  }

  const realpath = dependencies.realpath ?? defaultRealpath;
  return {
    packageRoot: realpath(dirname(packageJsonPath)),
    packageJsonPath,
    installedVersion: packageJson.version,
    exportsMapAbsent: packageJson.exports === undefined,
  };
}

/**
 * Join an allowlisted relative path under the package root and reject escapes.
 * Does not invent export maps — only joins and bounds-checks.
 */
export function resolveAllowlistedPathInsidePackageRoot(
  packageRoot: string,
  relativePath: string,
  dependencies: Pick<
    PackagedFactoriesFilesystemPullDependencies,
    "realpath"
  > = {},
): string {
  if (!isPackagedFactoriesAllowlistedRelativePath(relativePath)) {
    throw new PackagedFactoriesFilesystemPullError(
      "path-not-allowlisted",
      `Refusing to read non-allowlisted path "${relativePath}" under ${PACKAGED_FACTORIES_PACKAGE_NAME}.`,
      { relativePath },
    );
  }

  if (isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new PackagedFactoriesFilesystemPullError(
      "path-escapes-package-root",
      `Allowlisted path "${relativePath}" must be a relative path without parent segments.`,
      { relativePath },
    );
  }

  const realpath = dependencies.realpath ?? defaultRealpath;
  const packageRootReal = realpath(packageRoot);
  const candidate = normalize(join(packageRootReal, relativePath));
  const relativeToRoot = relative(packageRootReal, candidate);

  if (
    relativeToRoot.startsWith(`..${sep}`) ||
    relativeToRoot === ".." ||
    isAbsolute(relativeToRoot)
  ) {
    throw new PackagedFactoriesFilesystemPullError(
      "path-escapes-package-root",
      `Resolved path for "${relativePath}" escapes packaged-factories package root "${packageRootReal}".`,
      { relativePath },
    );
  }

  return candidate;
}

function pullOneAllowlistedFile(
  packageRoot: string,
  relativePath: PackagedFactoriesAllowlistedRelativePath,
  optional: boolean,
  dependencies: PackagedFactoriesFilesystemPullDependencies,
): PulledPackagedFactoriesFile | null {
  const pathExists = dependencies.pathExists ?? defaultPathExists;
  const readTextFile = dependencies.readTextFile ?? defaultReadTextFile;
  const absolutePath = resolveAllowlistedPathInsidePackageRoot(
    packageRoot,
    relativePath,
    dependencies,
  );

  if (!pathExists(absolutePath)) {
    if (optional) {
      return null;
    }
    throw new PackagedFactoriesFilesystemPullError(
      "missing-allowlisted-file",
      `Required allowlisted file "${relativePath}" is missing under installed ${PACKAGED_FACTORIES_PACKAGE_NAME}.`,
      { relativePath },
    );
  }

  // Bound-check again after existence so symlinks cannot escape the root.
  let absoluteRealPath: string;
  try {
    absoluteRealPath = (dependencies.realpath ?? defaultRealpath)(absolutePath);
  } catch (cause) {
    throw new PackagedFactoriesFilesystemPullError(
      "unreadable-allowlisted-file",
      `Allowlisted file "${relativePath}" exists but could not be realpath'd.`,
      { relativePath, cause },
    );
  }

  const packageRootReal = (dependencies.realpath ?? defaultRealpath)(
    packageRoot,
  );
  const relativeToRoot = relative(packageRootReal, absoluteRealPath);
  if (
    relativeToRoot.startsWith(`..${sep}`) ||
    relativeToRoot === ".." ||
    isAbsolute(relativeToRoot)
  ) {
    throw new PackagedFactoriesFilesystemPullError(
      "path-escapes-package-root",
      `Allowlisted file "${relativePath}" realpath escapes packaged-factories package root.`,
      { relativePath },
    );
  }

  let text: string;
  try {
    // Refuse directories; only plain files.
    if (!statSync(absoluteRealPath).isFile()) {
      throw new Error(`not a regular file: ${absoluteRealPath}`);
    }
    text = readTextFile(absoluteRealPath);
  } catch (cause) {
    throw new PackagedFactoriesFilesystemPullError(
      "unreadable-allowlisted-file",
      `Allowlisted file "${relativePath}" could not be read as UTF-8 text.`,
      { relativePath, cause },
    );
  }

  if (text.trim().length === 0) {
    throw new PackagedFactoriesFilesystemPullError(
      "empty-allowlisted-file",
      `Allowlisted file "${relativePath}" resolved to empty contents.`,
      { relativePath },
    );
  }

  // factory.json must be valid JSON; companion .js is text-only (never executed
  // and never parsed into derived workflow models).
  if (relativePath.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (cause) {
      throw new PackagedFactoriesFilesystemPullError(
        "unreadable-allowlisted-file",
        `Allowlisted JSON file "${relativePath}" did not parse as JSON.`,
        { relativePath, cause },
      );
    }
  }

  return {
    relativePath,
    absolutePath: absoluteRealPath,
    text,
    optional,
  };
}

/**
 * Pull all required (and present optional) allowlisted files from an already
 * installed packaged-factories package under `consumerDir`.
 */
export function pullPackagedFactoriesAllowlistedFiles(
  consumerDir: string,
  dependencies: PackagedFactoriesFilesystemPullDependencies = {},
): PackagedFactoriesFilesystemPullResult {
  const root = resolveInstalledPackagedFactoriesPackageRoot(
    consumerDir,
    dependencies,
  );

  // Absence of exports is expected — do not fail on exportsMapAbsent === true.
  const required: PulledPackagedFactoriesFile[] = [];
  for (const relativePath of PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS) {
    const pulled = pullOneAllowlistedFile(
      root.packageRoot,
      relativePath,
      false,
      dependencies,
    );
    if (pulled === null) {
      throw new PackagedFactoriesFilesystemPullError(
        "missing-allowlisted-file",
        `Required allowlisted file "${relativePath}" was not pulled.`,
        { relativePath },
      );
    }
    required.push(pulled);
  }

  const optionalPresent: PulledPackagedFactoriesFile[] = [];
  for (const relativePath of PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS) {
    const pulled = pullOneAllowlistedFile(
      root.packageRoot,
      relativePath,
      true,
      dependencies,
    );
    if (pulled !== null) {
      optionalPresent.push(pulled);
    }
  }

  return {
    packageRoot: root.packageRoot,
    installedVersion: root.installedVersion,
    exportsMapAbsent: root.exportsMapAbsent,
    required,
    optionalPresent,
  };
}

export type PackagedFactoriesFilesystemPullProofResult = {
  consumerDir: string;
  install: CleanConsumerInstallResult;
  pull: PackagedFactoriesFilesystemPullResult;
};

/**
 * Install the five exact 0.0.2 packages into a disposable consumer and prove
 * packaged-factories acquisition via allowlisted filesystem pull.
 */
export function provePackagedFactoriesFilesystemPull(
  options: PackagedFactoriesFilesystemPullDependencies & {
    keepOnSuccess?: boolean;
  } = {},
): PackagedFactoriesFilesystemPullProofResult {
  const install =
    options.install?.() ??
    installPackagedFactoryV002CleanConsumer({ keepOnSuccess: true });

  try {
    const pull = pullPackagedFactoriesAllowlistedFiles(
      install.consumerDir,
      options,
    );

    const result: PackagedFactoriesFilesystemPullProofResult = {
      consumerDir: install.consumerDir,
      install,
      pull,
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

/** file: URL helper for diagnostics / tests. */
export function toPackagedFactoriesFileUrl(absolutePath: string): string {
  return pathToFileURL(absolutePath).href;
}
