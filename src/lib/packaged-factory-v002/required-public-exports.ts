/**
 * Required Batch 1 declared public-export surfaces for the ESM library packages
 * in the packaged-factory 0.0.2 family (client / factory-replay /
 * factory-visualizers).
 *
 * Pure allowlist only — no filesystem or registry IO. Live proofs consume this
 * list and fail closed when an installed package's `exports` map does not cover
 * a required specifier.
 *
 * Packaged-factories@0.0.2 is acquired via direct allowlisted filesystem pull
 * (see `packaged-factories-allowlist.ts`), not through declared exports.
 */

export type RequiredPublicExportKind =
  | "recording-parser"
  | "replay-projections"
  | "visualizer-components"
  | "visualizer-styles";

export type RequiredPublicExportSurface = {
  id: RequiredPublicExportKind;
  packageName: string;
  /**
   * Package export subpath relative to the package root, using Node export-map
   * form (`.` for the root entry, `./styles.css`, …).
   */
  exportSubpath: string;
  /**
   * Full import specifier used by consumers (for example
   * `@you-agent-factory/client` or `@you-agent-factory/factory-visualizers/styles.css`).
   */
  specifier: string;
  /**
   * For JS module roots: named exports that must be present after import.
   * Empty for stylesheet surfaces.
   */
  requiredNamedExports: readonly string[];
};

const CLIENT = "@you-agent-factory/client";
const REPLAY = "@you-agent-factory/factory-replay";
const VISUALIZERS = "@you-agent-factory/factory-visualizers";

function toSpecifier(packageName: string, exportSubpath: string): string {
  if (exportSubpath === ".") {
    return packageName;
  }
  if (exportSubpath.startsWith("./")) {
    return `${packageName}/${exportSubpath.slice(2)}`;
  }
  return `${packageName}/${exportSubpath}`;
}

/**
 * Fixed required library surfaces proven through declared package exports.
 */
export const PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS: readonly RequiredPublicExportSurface[] =
  [
    {
      id: "recording-parser",
      packageName: CLIENT,
      exportSubpath: ".",
      specifier: toSpecifier(CLIENT, "."),
      requiredNamedExports: [
        "parseFactoryRecording",
        "safeParseFactoryRecording",
      ],
    },
    {
      id: "replay-projections",
      packageName: REPLAY,
      exportSubpath: ".",
      specifier: toSpecifier(REPLAY, "."),
      requiredNamedExports: [
        "projectFactoryTopologyAtTick",
        "projectFactoryWorkProgressAtTick",
        "projectFactoryActivityAtTick",
        "projectFactoryLoadAtTick",
      ],
    },
    {
      id: "visualizer-components",
      packageName: VISUALIZERS,
      exportSubpath: ".",
      specifier: toSpecifier(VISUALIZERS, "."),
      requiredNamedExports: [
        "FactoryTopologyReplay",
        "FactoryRecordingTopologyReplay",
        "WorkProgressVisualizer",
      ],
    },
    {
      id: "visualizer-styles",
      packageName: VISUALIZERS,
      exportSubpath: "./styles.css",
      specifier: toSpecifier(VISUALIZERS, "./styles.css"),
      requiredNamedExports: [],
    },
  ] as const;

/** Full Batch 1 required library public-export surface list. */
export function buildPackagedFactoryV002RequiredPublicExports(): RequiredPublicExportSurface[] {
  return [...PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS];
}
