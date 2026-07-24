/**
 * Host install IO for packaged-factory 0.0.2 pin proof.
 *
 * Reads docs package.json + installed node_modules trees. Pure pin rules live
 * in host-package-pins.ts.
 */

import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  type PackagedFactoryV002PackageName,
} from "./five-package-pins";
import {
  assertHostPackagedFactoryV002DependencyPins,
  assertHostPackagedFactoryV002InstalledVersions,
  assertSingleComponentsResolvedVersion,
  HostPackagePinError,
} from "./host-package-pins";

export type HostPackagedFactoryV002PinProof = {
  declaredPins: Record<PackagedFactoryV002PackageName, string>;
  installedVersions: Record<PackagedFactoryV002PackageName, string>;
  resolvedComponentsVersions: string[];
};

function readJsonObject(path: string): Record<string, unknown> {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HostPackagePinError(
      "missing-pin",
      `Expected JSON object at ${path}.`,
    );
  }
  return parsed as Record<string, unknown>;
}

function readPackageVersion(packageJsonPath: string): string {
  const document = readJsonObject(packageJsonPath);
  const version = document.version;
  if (typeof version !== "string" || version.length === 0) {
    throw new HostPackagePinError(
      "version-drift",
      `Expected version string in ${packageJsonPath}.`,
    );
  }
  return version;
}

function readDeclaredPins(
  projectRoot: string,
): Record<PackagedFactoryV002PackageName, string> {
  const packageJson = readJsonObject(join(projectRoot, "package.json"));
  const dependencies = packageJson.dependencies;
  if (
    !dependencies ||
    typeof dependencies !== "object" ||
    Array.isArray(dependencies)
  ) {
    throw new HostPackagePinError(
      "missing-pin",
      "Docs host package.json must declare a dependencies object.",
    );
  }

  const deps = dependencies as Record<string, unknown>;
  assertHostPackagedFactoryV002DependencyPins(deps);

  return Object.fromEntries(
    PACKAGED_FACTORY_V002_PACKAGE_NAMES.map((name) => [
      name,
      deps[name] as string,
    ]),
  ) as Record<PackagedFactoryV002PackageName, string>;
}

function readInstalledVersions(
  projectRoot: string,
): Record<PackagedFactoryV002PackageName, string> {
  const installed = {} as Record<PackagedFactoryV002PackageName, string>;
  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    const packageJsonPath = Bun.resolveSync(
      `${name}/package.json`,
      projectRoot,
    );
    installed[name] = readPackageVersion(packageJsonPath);
  }
  return installed;
}

/**
 * Walk node_modules (including nested) for every installed
 * `@you-agent-factory/components/package.json` and collect version strings.
 */
export function collectResolvedComponentsVersions(
  projectRoot: string,
): string[] {
  const nodeModulesRoot = join(projectRoot, "node_modules");
  const versions: string[] = [];
  const seenRealPaths = new Set<string>();

  function visitDir(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry === ".cache" || entry === ".bin") {
        continue;
      }

      const absolute = join(dir, entry);
      let stats: ReturnType<typeof statSync>;
      try {
        stats = statSync(absolute);
      } catch {
        continue;
      }

      if (!stats.isDirectory()) {
        continue;
      }

      if (entry.startsWith("@")) {
        visitDir(absolute);
        continue;
      }

      if (dir.endsWith("@you-agent-factory") && entry === "components") {
        const packageJsonPath = join(absolute, "package.json");
        try {
          const realPath = realpathSync(packageJsonPath);
          if (seenRealPaths.has(realPath)) {
            continue;
          }
          seenRealPaths.add(realPath);
          versions.push(readPackageVersion(packageJsonPath));
        } catch {
          // Missing package.json — skip; pin proof will fail elsewhere if needed.
        }
        continue;
      }

      const nestedNodeModules = join(absolute, "node_modules");
      try {
        if (statSync(nestedNodeModules).isDirectory()) {
          visitDir(nestedNodeModules);
        }
      } catch {
        // no nested node_modules
      }
    }
  }

  visitDir(nodeModulesRoot);
  return versions;
}

/**
 * Prove the docs host declares and resolves the five Batch 1 packages at exact
 * 0.0.2 with a single components version in the install tree.
 */
export function proveHostPackagedFactoryV002Pins(
  projectRoot: string = process.cwd(),
): HostPackagedFactoryV002PinProof {
  const declaredPins = readDeclaredPins(projectRoot);
  const installedVersions = readInstalledVersions(projectRoot);
  assertHostPackagedFactoryV002InstalledVersions(installedVersions);

  const resolvedComponentsVersions =
    collectResolvedComponentsVersions(projectRoot);
  assertSingleComponentsResolvedVersion(resolvedComponentsVersions);

  return {
    declaredPins,
    installedVersions,
    resolvedComponentsVersions,
  };
}
