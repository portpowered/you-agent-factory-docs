import { describe, expect, test } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import { relative } from "node:path";
import { installPackagedFactoryV002CleanConsumer } from "./clean-consumer-install";
import {
  matchesNodeExportPattern,
  normalizePackageExportsMap,
  packageExportsMapCoversSubpath,
} from "./export-map-coverage";
import {
  isPackagedFactoriesAllowlistedRelativePath,
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS,
  PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
  packagedFactoriesFactoryJsonRelativePath,
} from "./packaged-factories-allowlist";
import {
  PackagedFactoriesFilesystemPullError,
  provePackagedFactoriesFilesystemPull,
  pullPackagedFactoriesAllowlistedFiles,
  resolveAllowlistedPathInsidePackageRoot,
  resolveInstalledPackagedFactoriesPackageRoot,
} from "./packaged-factories-filesystem-pull";
import {
  provePackagedFactoryV002PublicExports,
  proveRequiredPublicExportSurface,
  readInstalledPackageExportsMap,
} from "./public-export-proof";
import {
  buildPackagedFactoryV002RequiredPublicExports,
  PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS,
} from "./required-public-exports";
import { provePackagedFactoryV002SplitAcquisition } from "./split-acquisition-proof";

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
    expect(matchesNodeExportPattern("./styles.css", "./styles.css")).toBe(true);
  });

  test("fails closed when exports map is missing or incomplete", () => {
    expect(normalizePackageExportsMap(undefined)).toBeNull();
    expect(packageExportsMapCoversSubpath(null, ".")).toBe(false);

    const map = normalizePackageExportsMap({
      ".": "./dist/index.js",
      "./styles.css": "./dist/styles.css",
    });
    expect(map).not.toBeNull();
    expect(packageExportsMapCoversSubpath(map, ".")).toBe(true);
    expect(packageExportsMapCoversSubpath(map, "./styles.css")).toBe(true);
    expect(packageExportsMapCoversSubpath(map, "./manifest")).toBe(false);
  });
});

describe("packaged-factory v0.0.2 required library public-export surfaces", () => {
  test("lists recording parser, replay projections, and visualizer components/styles only", () => {
    const surfaces = buildPackagedFactoryV002RequiredPublicExports();
    const ids = surfaces.map((surface) => surface.id);

    expect(ids).toEqual([
      "recording-parser",
      "replay-projections",
      "visualizer-components",
      "visualizer-styles",
    ]);
    expect(
      PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.find(
        (surface) => surface.id === "recording-parser",
      )?.specifier,
    ).toBe("@you-agent-factory/client");
    expect(
      surfaces.some((surface) =>
        surface.packageName.includes("packaged-factories"),
      ),
    ).toBe(false);
  });
});

describe("packaged-factory v0.0.2 packaged-factories allowlist", () => {
  test("uses locked slug order and factories/<slug>/factory.json paths", () => {
    expect([...PACKAGED_FACTORIES_ALLOWLIST_SLUGS]).toEqual([
      "goal",
      "subagent",
      "fusion",
      "review",
      "quorum",
      "tts",
      "deep-research",
    ]);
    expect([...PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS]).toEqual(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) =>
        packagedFactoriesFactoryJsonRelativePath(slug),
      ),
    );
    expect([...PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS]).toEqual([
      "factories/deep-research/scripts/deep-research.workflow.js",
    ]);
    expect(
      isPackagedFactoriesAllowlistedRelativePath("factories/goal/factory.json"),
    ).toBe(true);
    expect(
      isPackagedFactoriesAllowlistedRelativePath(
        "factories/deep-research.json",
      ),
    ).toBe(false);
    expect(isPackagedFactoriesAllowlistedRelativePath("../etc/passwd")).toBe(
      false,
    );
  });
});

describe("packaged-factory v0.0.2 library public-export proof", () => {
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

      for (const surface of PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS) {
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

  test("full library-export proof succeeds without requiring packaged-factories exports", async () => {
    const result = await provePackagedFactoryV002PublicExports({
      keepOnSuccess: true,
    });

    try {
      expect(result.proven).toHaveLength(
        PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.length,
      );
      const packagedExports = readInstalledPackageExportsMap(
        result.consumerDir,
        "@you-agent-factory/packaged-factories",
      );
      // Absence of exports map is expected and must not fail library proof.
      expect(packagedExports).toBeNull();
    } finally {
      rmSync(result.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);
});

describe("packaged-factory v0.0.2 packaged-factories filesystem pull", () => {
  test("pulls allowlisted factories/<slug>/factory.json and optional deep-research companion", () => {
    const proof = provePackagedFactoriesFilesystemPull({ keepOnSuccess: true });

    try {
      expect(proof.pull.installedVersion).toBe("0.0.2");
      expect(proof.pull.exportsMapAbsent).toBe(true);
      expect(proof.pull.required.map((file) => file.relativePath)).toEqual([
        ...PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
      ]);
      for (const file of proof.pull.required) {
        expect(file.text.trim().length).toBeGreaterThan(0);
        expect(() => JSON.parse(file.text)).not.toThrow();
        const relativeToRoot = relative(
          proof.pull.packageRoot,
          file.absolutePath,
        );
        expect(relativeToRoot.startsWith("..")).toBe(false);
        expect(relativeToRoot).toBe(file.relativePath);
      }

      expect(
        proof.pull.optionalPresent.map((file) => file.relativePath),
      ).toEqual(["factories/deep-research/scripts/deep-research.workflow.js"]);
      const companion = proof.pull.optionalPresent[0];
      // Companion JS is read as text only — never executed into a derived model.
      expect(companion?.text.includes("lead-research")).toBe(true);
      expect(companion?.text.trim().length).toBeGreaterThan(0);
    } finally {
      rmSync(proof.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("fails closed on non-allowlisted paths and does not invent export maps", () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      const root = resolveInstalledPackagedFactoriesPackageRoot(
        install.consumerDir,
      );
      expect(root.exportsMapAbsent).toBe(true);

      let thrown: unknown;
      try {
        resolveAllowlistedPathInsidePackageRoot(
          root.packageRoot,
          "factories/goal/prompts/executor.md",
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(PackagedFactoriesFilesystemPullError);
      expect((thrown as PackagedFactoriesFilesystemPullError).code).toBe(
        "path-not-allowlisted",
      );

      let escapeThrown: unknown;
      try {
        resolveAllowlistedPathInsidePackageRoot(
          root.packageRoot,
          "../escape.json" as never,
        );
      } catch (error) {
        escapeThrown = error;
      }
      expect(escapeThrown).toBeInstanceOf(PackagedFactoriesFilesystemPullError);
      expect((escapeThrown as PackagedFactoriesFilesystemPullError).code).toBe(
        "path-not-allowlisted",
      );
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("fails closed when a required allowlisted file is missing", () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      let thrown: unknown;
      try {
        pullPackagedFactoriesAllowlistedFiles(install.consumerDir, {
          pathExists: (absolutePath) =>
            !absolutePath.endsWith("factories/goal/factory.json"),
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(PackagedFactoriesFilesystemPullError);
      const failure = thrown as PackagedFactoriesFilesystemPullError;
      expect(failure.code).toBe("missing-allowlisted-file");
      expect(failure.relativePath).toBe("factories/goal/factory.json");
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("fails closed when installed packaged-factories version is not exact 0.0.2", () => {
    const install = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      let thrown: unknown;
      try {
        resolveInstalledPackagedFactoriesPackageRoot(install.consumerDir, {
          readTextFile: (absolutePath) => {
            const text = readFileSync(absolutePath, "utf8");
            if (
              absolutePath.includes("@you-agent-factory/packaged-factories") &&
              absolutePath.endsWith("package.json")
            ) {
              return text.replace('"version": "0.0.2"', '"version": "9.9.9"');
            }
            return text;
          },
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(PackagedFactoriesFilesystemPullError);
      expect((thrown as PackagedFactoriesFilesystemPullError).code).toBe(
        "wrong-version",
      );
    } finally {
      rmSync(install.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);
});

describe("packaged-factory v0.0.2 split acquisition proof", () => {
  test("proves library exports and packaged-factories filesystem pull together", async () => {
    const result = await provePackagedFactoryV002SplitAcquisition({
      keepOnSuccess: true,
    });

    try {
      expect(result.libraryExports).toHaveLength(
        PACKAGED_FACTORY_V002_FIXED_REQUIRED_EXPORTS.length,
      );
      expect(result.packagedFactoriesPull.exportsMapAbsent).toBe(true);
      expect(result.packagedFactoriesPull.required).toHaveLength(
        PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS.length,
      );
      expect(
        result.packagedFactoriesPull.optionalPresent.map((f) => f.relativePath),
      ).toContain("factories/deep-research/scripts/deep-research.workflow.js");
    } finally {
      rmSync(result.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);
});
