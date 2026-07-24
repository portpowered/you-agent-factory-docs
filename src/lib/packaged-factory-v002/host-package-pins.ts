/**
 * Pure host package.json pin assertions for the packaged-factory 0.0.2 family.
 *
 * IO-free: callers pass already-parsed dependency / resolved-version maps.
 * Fail closed when any of the five pins drift from exact 0.0.2 or when more
 * than one components version resolves in the installed tree.
 */

import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  PACKAGED_FACTORY_V002_VERSION,
  type PackagedFactoryV002PackageName,
} from "./five-package-pins";

export class HostPackagePinError extends Error {
  readonly code: "missing-pin" | "version-drift" | "dual-components";

  constructor(code: HostPackagePinError["code"], message: string) {
    super(message);
    this.name = "HostPackagePinError";
    this.code = code;
  }
}

/**
 * Assert docs host package.json dependencies declare exact `"0.0.2"` for each
 * of the five Batch 1 packages.
 */
export function assertHostPackagedFactoryV002DependencyPins(
  dependencies: Record<string, unknown>,
): void {
  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    const version = dependencies[name];
    if (version === undefined) {
      throw new HostPackagePinError(
        "missing-pin",
        `Docs host package.json must declare ${name} at exact "${PACKAGED_FACTORY_V002_VERSION}".`,
      );
    }
    if (version !== PACKAGED_FACTORY_V002_VERSION) {
      throw new HostPackagePinError(
        "version-drift",
        `Docs host must pin ${name} to exact "${PACKAGED_FACTORY_V002_VERSION}" (observed ${JSON.stringify(version)}).`,
      );
    }
  }
}

/**
 * Assert each installed package reports version 0.0.2 (one entry per name).
 */
export function assertHostPackagedFactoryV002InstalledVersions(
  installedVersions: Partial<Record<PackagedFactoryV002PackageName, string>>,
): void {
  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    const version = installedVersions[name];
    if (version !== PACKAGED_FACTORY_V002_VERSION) {
      throw new HostPackagePinError(
        "version-drift",
        `Installed ${name} must report version "${PACKAGED_FACTORY_V002_VERSION}" (observed ${JSON.stringify(version)}).`,
      );
    }
  }
}

/**
 * Fail closed when more than one distinct components version appears in the
 * resolved install tree (e.g. leftover 0.0.0 alongside 0.0.2).
 */
export function assertSingleComponentsResolvedVersion(
  resolvedComponentsVersions: readonly string[],
): void {
  const unique = [...new Set(resolvedComponentsVersions)];
  if (unique.length === 0) {
    throw new HostPackagePinError(
      "missing-pin",
      `No resolved @you-agent-factory/components version found; expected exact "${PACKAGED_FACTORY_V002_VERSION}".`,
    );
  }
  if (unique.length > 1) {
    throw new HostPackagePinError(
      "dual-components",
      `Docs host must resolve a single @you-agent-factory/components@${PACKAGED_FACTORY_V002_VERSION}; observed versions: ${unique.join(", ")}.`,
    );
  }
  if (unique[0] !== PACKAGED_FACTORY_V002_VERSION) {
    throw new HostPackagePinError(
      "version-drift",
      `Docs host must resolve @you-agent-factory/components@${PACKAGED_FACTORY_V002_VERSION} (observed ${JSON.stringify(unique[0])}).`,
    );
  }
}
