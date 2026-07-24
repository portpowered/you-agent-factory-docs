/**
 * Next transpilePackages posture for the packaged-factory 0.0.2 family.
 *
 * Pure constants/helpers only. All five @you-agent-factory/* Batch 1 packages
 * at exact 0.0.2 ship compiled ESM (or are data-only for packaged-factories),
 * so the docs host must not list any of them in transpilePackages.
 *
 * If a future pin ships TypeScript source again and a clean static build fails
 * without host transpilation, keep `@you-agent-factory/components` only with
 * recorded evidence — never expand to client / factory-replay /
 * factory-visualizers / packaged-factories.
 */

import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  type PackagedFactoryV002PackageName,
} from "./five-package-pins";

/**
 * Final transpilePackages membership for this family after the clean static
 * build proved compiled ESM does not need host transpilation: empty.
 */
export const PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES = [] as const;

/** Packages that must never appear in Next transpilePackages for Batch 1. */
export const PACKAGED_FACTORY_V002_FORBIDDEN_TRANSPILE_PACKAGES =
  PACKAGED_FACTORY_V002_PACKAGE_NAMES;

export class TranspilePackagesPostureError extends Error {
  readonly code: "forbidden-transpile-package";

  constructor(message: string) {
    super(message);
    this.name = "TranspilePackagesPostureError";
    this.code = "forbidden-transpile-package";
  }
}

/**
 * Fail closed when any Batch 1 family package appears in transpilePackages.
 */
export function assertPackagedFactoryV002TranspilePackagesPosture(
  transpilePackages: readonly string[],
): void {
  const forbidden = new Set<string>(
    PACKAGED_FACTORY_V002_FORBIDDEN_TRANSPILE_PACKAGES,
  );
  const offenders = transpilePackages.filter((name) => forbidden.has(name));
  if (offenders.length === 0) {
    return;
  }
  throw new TranspilePackagesPostureError(
    `Next transpilePackages must not include packaged-factory 0.0.2 family packages (compiled ESM / data package). Offenders: ${offenders.join(", ")}.`,
  );
}

/**
 * Assert the host membership constant stays empty of the five family packages.
 */
export function assertPackagedFactoryV002HostTranspileMembership(
  membership: readonly string[] = PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES,
): void {
  assertPackagedFactoryV002TranspilePackagesPosture(membership);
  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    if ((membership as readonly string[]).includes(name)) {
      throw new TranspilePackagesPostureError(
        `PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES must not include ${name as PackagedFactoryV002PackageName}.`,
      );
    }
  }
}
