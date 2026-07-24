/**
 * Exact Batch 1 pins for the packaged-factory 0.0.2 family.
 *
 * Pure constants only — no filesystem or registry IO. Host pin + clean-consumer
 * install proofs both consume this list so the five-package set stays singular.
 */

export const PACKAGED_FACTORY_V002_VERSION = "0.0.2" as const;

export const PACKAGED_FACTORY_V002_PACKAGE_NAMES = [
  "@you-agent-factory/client",
  "@you-agent-factory/components",
  "@you-agent-factory/factory-replay",
  "@you-agent-factory/factory-visualizers",
  "@you-agent-factory/packaged-factories",
] as const;

export type PackagedFactoryV002PackageName =
  (typeof PACKAGED_FACTORY_V002_PACKAGE_NAMES)[number];

export type PackagedFactoryV002ExactPins = Record<
  PackagedFactoryV002PackageName,
  typeof PACKAGED_FACTORY_V002_VERSION
>;

/** Exact dependency map: each of the five packages pinned to `"0.0.2"`. */
export function buildPackagedFactoryV002ExactPins(): PackagedFactoryV002ExactPins {
  return Object.fromEntries(
    PACKAGED_FACTORY_V002_PACKAGE_NAMES.map((name) => [
      name,
      PACKAGED_FACTORY_V002_VERSION,
    ]),
  ) as PackagedFactoryV002ExactPins;
}
