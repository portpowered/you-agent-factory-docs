import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { installPackagedFactoryV002CleanConsumer } from "./clean-consumer-install";
import {
  matchesNodeExportPattern,
  normalizePackageExportsMap,
  packageExportsMapCoversSubpath,
} from "./export-map-coverage";
import {
  PublicExportProofError,
  provePackagedFactoryV002PublicExports,
  proveRequiredPublicExportSurface,
  readInstalledPackageExportsMap,
} from "./public-export-proof";
import {
  buildPackagedFactoryDefinitionExportSurfaces,
  buildPackagedFactoryV002RequiredPublicExports,
  PACKAGED_FACTORY_V002_CATALOG_SLUGS,
  PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS,
} from "./required-public-exports";

describe("packaged-factory v0.0.2 export-map coverage", () => {
  test("matches single-segment Node export patterns", () => {
    expect(
      matchesNodeExportPattern(
        "./factories/*.json",
        "./factories/deep-research.json",
      ),
    ).toBe(true);
    expect(
      matchesNodeExportPattern(
        "./factories/*.json",
        "./factories/deep-research/factory.json",
      ),
    ).toBe(false);
    expect(matchesNodeExportPattern("./manifest", "./manifest")).toBe(true);
  });

  test("fails closed when exports map is missing or incomplete", () => {
    expect(normalizePackageExportsMap(undefined)).toBeNull();
    expect(packageExportsMapCoversSubpath(null, "./manifest")).toBe(false);

    const map = normalizePackageExportsMap({
      ".": "./dist/index.js",
      "./styles.css": "./dist/styles.css",
      "./factories/*.json": "./generated/factories/*/factory.json",
    });
    expect(map).not.toBeNull();
    expect(packageExportsMapCoversSubpath(map, ".")).toBe(true);
    expect(packageExportsMapCoversSubpath(map, "./styles.css")).toBe(true);
    expect(
      packageExportsMapCoversSubpath(map, "./factories/deep-research.json"),
    ).toBe(true);
    expect(packageExportsMapCoversSubpath(map, "./manifest")).toBe(false);
  });
});

describe("packaged-factory v0.0.2 required public-export surfaces", () => {
  test("lists recording parser, replay, visualizers, manifest, deep-research, and all factory definitions", () => {
    const surfaces = buildPackagedFactoryV002RequiredPublicExports();
    const ids = surfaces.map((surface) => surface.id);

    expect(ids).toContain("recording-parser");
    expect(ids).toContain("replay-projections");
    expect(ids).toContain("visualizer-components");
    expect(ids).toContain("visualizer-styles");
    expect(ids).toContain("package-order-metadata");
    expect(ids).toContain("deep-research-source");
    expect(
      ids.filter((id) => id === "packaged-factory-definitions"),
    ).toHaveLength(PACKAGED_FACTORY_V002_CATALOG_SLUGS.length);

    expect(
      PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.find(
        (surface) => surface.id === "recording-parser",
      )?.specifier,
    ).toBe("@you-agent-factory/client");
    expect(
      PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.find(
        (surface) => surface.id === "package-order-metadata",
      )?.specifier,
    ).toBe("@you-agent-factory/packaged-factories/manifest");
    expect(
      buildPackagedFactoryDefinitionExportSurfaces().map((s) => s.specifier),
    ).toEqual(
      PACKAGED_FACTORY_V002_CATALOG_SLUGS.map(
        (slug) =>
          `@you-agent-factory/packaged-factories/factories/${slug}.json`,
      ),
    );
  });
});

describe("packaged-factory v0.0.2 public-export proof", () => {
  test("proves client, factory-replay, and factory-visualizers through declared exports", async () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      const clientExports = readInstalledPackageExportsMap(
        install.consumerDir,
        "@you-agent-factory/client",
      );
      const replayExports = readInstalledPackageExportsMap(
        install.consumerDir,
        "@you-agent-factory/factory-replay",
      );
      const visualizerExports = readInstalledPackageExportsMap(
        install.consumerDir,
        "@you-agent-factory/factory-visualizers",
      );

      expect(clientExports).not.toBeNull();
      expect(replayExports).not.toBeNull();
      expect(visualizerExports).not.toBeNull();
      expect(packageExportsMapCoversSubpath(clientExports, ".")).toBe(true);
      expect(packageExportsMapCoversSubpath(replayExports, ".")).toBe(true);
      expect(packageExportsMapCoversSubpath(visualizerExports, ".")).toBe(true);
      expect(
        packageExportsMapCoversSubpath(visualizerExports, "./styles.css"),
      ).toBe(true);

      const jsSurfaces = PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.filter(
        (surface) =>
          surface.id === "recording-parser" ||
          surface.id === "replay-projections" ||
          surface.id === "visualizer-components" ||
          surface.id === "visualizer-styles",
      );

      for (const surface of jsSurfaces) {
        const proven = await proveRequiredPublicExportSurface(
          install.consumerDir,
          surface,
        );
        expect(proven.surface.specifier).toBe(surface.specifier);
        expect(proven.resolvedUrl.startsWith("file:")).toBe(true);
        expect(proven.namedExportsPresent).toEqual([
          ...surface.requiredNamedExports,
        ]);
      }
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("fails closed when packaged-factories@0.0.2 lacks a published exports map", async () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      const packagedExports = readInstalledPackageExportsMap(
        install.consumerDir,
        "@you-agent-factory/packaged-factories",
      );
      expect(packagedExports).toBeNull();

      const manifestSurface = PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.find(
        (surface) => surface.id === "package-order-metadata",
      );
      if (!manifestSurface) {
        throw new Error("expected package-order-metadata surface");
      }

      let thrown: unknown;
      try {
        await proveRequiredPublicExportSurface(
          install.consumerDir,
          manifestSurface,
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(PublicExportProofError);
      const failure = thrown as PublicExportProofError;
      expect(failure.code).toBe("missing-export-map");
      expect(failure.surface.id).toBe("package-order-metadata");
      expect(failure.message).toMatch(/no published exports map/);
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("does not accept nested authored-source paths as declared public exports", async () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      // Even if legacy Node resolution can invent a filesystem path under
      // factories/<slug>/factory.json, the Batch 1 contract requires the
      // documented flattened export `./factories/<slug>.json` in the map.
      const illegalSurface = {
        id: "deep-research-source" as const,
        packageName: "@you-agent-factory/packaged-factories",
        exportSubpath: "./factories/deep-research/factory.json",
        specifier:
          "@you-agent-factory/packaged-factories/factories/deep-research/factory.json",
        requiredNamedExports: [] as const,
      };

      let thrown: unknown;
      try {
        await proveRequiredPublicExportSurface(
          install.consumerDir,
          illegalSurface,
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(PublicExportProofError);
      expect((thrown as PublicExportProofError).code).toBe(
        "missing-export-map",
      );
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("full required-surface proof fails closed on published packaged-factories@0.0.2", async () => {
    let thrown: unknown;
    try {
      await provePackagedFactoryV002PublicExports();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(PublicExportProofError);
    const failure = thrown as PublicExportProofError;
    expect(failure.code).toBe("missing-export-map");
    expect(failure.surface.packageName).toBe(
      "@you-agent-factory/packaged-factories",
    );
  }, 180_000);
});
