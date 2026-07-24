/**
 * Required Batch 1 public-export surfaces for the packaged-factory 0.0.2 family.
 *
 * Pure allowlist only — no filesystem or registry IO. Live proofs consume this
 * list and fail closed when an installed package's `exports` map does not cover
 * a required specifier (never invent undocumented package-internal paths).
 */

export type RequiredPublicExportKind =
  | "recording-parser"
  | "replay-projections"
  | "visualizer-components"
  | "visualizer-styles"
  | "packaged-factory-definitions"
  | "package-order-metadata"
  | "deep-research-source";

export type RequiredPublicExportSurface = {
  id: RequiredPublicExportKind;
  packageName: string;
  /**
   * Package export subpath relative to the package root, using Node export-map
   * form (`.` for the root entry, `./styles.css`, `./manifest`, …).
   */
  exportSubpath: string;
  /**
   * Full import specifier used by consumers (for example
   * `@you-agent-factory/client` or `@you-agent-factory/factory-visualizers/styles.css`).
   */
  specifier: string;
  /**
   * For JS module roots: named exports that must be present after import.
   * Empty for stylesheet / JSON data surfaces.
   */
  requiredNamedExports: readonly string[];
};

/**
 * Factory slugs expected from the packaged-factories catalog contract.
 * Used only after `./manifest` resolves; proofs still fail closed when the
 * installed export map lacks `./factories/*.json` or a slug entry is missing.
 */
export const PACKAGED_FACTORY_V002_CATALOG_SLUGS = [
  "deep-research",
  "fusion",
  "goal",
  "quorum",
  "review",
  "subagent",
  "tts",
] as const;

export type PackagedFactoryV002CatalogSlug =
  (typeof PACKAGED_FACTORY_V002_CATALOG_SLUGS)[number];

const CLIENT = "@you-agent-factory/client";
const REPLAY = "@you-agent-factory/factory-replay";
const VISUALIZERS = "@you-agent-factory/factory-visualizers";
const PACKAGED = "@you-agent-factory/packaged-factories";

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
 * Fixed required surfaces (excluding per-slug factory definition imports, which
 * are derived from {@link PACKAGED_FACTORY_V002_CATALOG_SLUGS}).
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
    {
      id: "package-order-metadata",
      packageName: PACKAGED,
      exportSubpath: "./manifest",
      specifier: toSpecifier(PACKAGED, "./manifest"),
      requiredNamedExports: [],
    },
    {
      id: "deep-research-source",
      packageName: PACKAGED,
      exportSubpath: "./factories/deep-research.json",
      specifier: toSpecifier(PACKAGED, "./factories/deep-research.json"),
      requiredNamedExports: [],
    },
  ] as const;

/** One required surface per catalog factory definition (`./factories/<slug>.json`). */
export function buildPackagedFactoryDefinitionExportSurfaces(): RequiredPublicExportSurface[] {
  return PACKAGED_FACTORY_V002_CATALOG_SLUGS.map((slug) => {
    const exportSubpath = `./factories/${slug}.json`;
    return {
      id: "packaged-factory-definitions" as const,
      packageName: PACKAGED,
      exportSubpath,
      specifier: toSpecifier(PACKAGED, exportSubpath),
      requiredNamedExports: [],
    };
  });
}

/** Full Batch 1 required public-export surface list (fixed + per-slug factories). */
export function buildPackagedFactoryV002RequiredPublicExports(): RequiredPublicExportSurface[] {
  return [
    ...PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS,
    ...buildPackagedFactoryDefinitionExportSurfaces(),
  ];
}
