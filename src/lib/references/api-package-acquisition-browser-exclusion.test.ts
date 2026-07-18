import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  API_PACKAGE_BROWSER_SAFE_ACQUISITION_MODULES,
  API_PACKAGE_SERVER_ONLY_ACQUISITION_MODULES,
  evaluateApiPackageAcquisitionBrowserBundleLeakage,
  isApiPackageAcquisitionBrowserSafeBundleClean,
  isApiPackageAcquisitionModuleExcludedFromBrowserBundles,
} from "./api-package-acquisition-browser-exclusion";
import { bundleApiPackageAcquisitionModuleForBrowser } from "./api-package-acquisition-browser-exclusion-bundling";
import {
  ApiPackageArtifactResolutionError,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";

describe("package-internal acquisition rejection", () => {
  test("rejects package-root imports with an actionable illegal-target error", () => {
    try {
      resolveApiPackageArtifact("@you-agent-factory/api");
      throw new Error("expected package-root rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe("@you-agent-factory/api");
      expect(resolutionError.message).toContain("package-root");
      expect(resolutionError.message).toContain("@you-agent-factory/api");
    }
  });

  test("rejects package-internal generated/... export targets", () => {
    const illegal = "@you-agent-factory/api/generated/cli/commands.json";

    try {
      resolveApiPackageArtifact(illegal);
      throw new Error("expected package-internal rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe(illegal);
      expect(resolutionError.message).toContain("generated/");
      expect(resolutionError.message).toContain(illegal);
    }
  });

  test("rejects raw package filesystem paths", () => {
    const absolutePath = join(
      process.cwd(),
      "node_modules/@you-agent-factory/api/generated/manifest.json",
    );

    try {
      resolveApiPackageArtifact(absolutePath);
      throw new Error("expected filesystem-path rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      const resolutionError = error as ApiPackageArtifactResolutionError;
      expect(resolutionError.code).toBe("illegal-target");
      expect(resolutionError.target).toBe(absolutePath);
      expect(resolutionError.message).toContain(absolutePath);
      expect(resolutionError.message).toMatch(
        /filesystem|public package exports/i,
      );
    }
  });
});

describe("api-package acquisition browser-bundle exclusion", () => {
  test("detects Node filesystem and package-resolution markers in bundle text", () => {
    const evaluation = evaluateApiPackageAcquisitionBrowserBundleLeakage(
      [
        'import { readFileSync } from "node:fs";',
        'import { fileURLToPath } from "node:url";',
        "const url = import.meta.resolve(specifier);",
      ].join("\n"),
    );

    expect(evaluation.leaksNodeAcquisitionApis).toBe(true);
    expect(evaluation.markers).toEqual([
      "node:fs",
      "node:url",
      "readFileSync",
      "import.meta.resolve",
      "fileURLToPath",
    ]);
  });

  test("treats clean browser helper output as non-leaking", () => {
    const evaluation = evaluateApiPackageAcquisitionBrowserBundleLeakage(
      'export const API_PACKAGE_NAME = "@you-agent-factory/api";',
    );

    expect(evaluation.leaksNodeAcquisitionApis).toBe(false);
    expect(evaluation.markers).toEqual([]);
  });

  test("browser-safe acquisition modules emit client chunks without Node acquisition APIs", async () => {
    for (const entrypoint of API_PACKAGE_BROWSER_SAFE_ACQUISITION_MODULES) {
      const attempt = await bundleApiPackageAcquisitionModuleForBrowser({
        entrypoint,
      });

      expect(attempt.success).toBe(true);
      expect(isApiPackageAcquisitionBrowserSafeBundleClean(attempt)).toBe(true);

      const evaluation = evaluateApiPackageAcquisitionBrowserBundleLeakage(
        attempt.bundleText,
      );
      expect(evaluation.leaksNodeAcquisitionApis).toBe(false);
      expect(evaluation.markers).toEqual([]);
    }
  });

  test("server-only acquisition modules cannot ship cleanly in browser bundles", async () => {
    for (const entrypoint of API_PACKAGE_SERVER_ONLY_ACQUISITION_MODULES) {
      const attempt = await bundleApiPackageAcquisitionModuleForBrowser({
        entrypoint,
      });

      expect(
        isApiPackageAcquisitionModuleExcludedFromBrowserBundles(attempt),
      ).toBe(true);

      if (attempt.success) {
        const evaluation = evaluateApiPackageAcquisitionBrowserBundleLeakage(
          attempt.bundleText,
        );
        expect(evaluation.leaksNodeAcquisitionApis).toBe(true);
        expect(evaluation.markers.length).toBeGreaterThan(0);
      } else {
        const joinedFailures = attempt.failureMessages.join("\n");
        expect(joinedFailures.length).toBeGreaterThan(0);
        expect(joinedFailures).toMatch(/node:|Browser polyfill|browser/i);
      }
    }
  });

  test("server-only acquisition modules remain build/server entrypoints, not client UI deps", async () => {
    // A client-shaped import of the Node resolver must fail closed for browser
    // targets — proving these modules cannot be runtime UI dependencies.
    const resolverAttempt = await bundleApiPackageAcquisitionModuleForBrowser({
      entrypoint: "src/lib/references/api-package-artifact-resolver.ts",
    });

    expect(resolverAttempt.success).toBe(false);
    expect(
      isApiPackageAcquisitionModuleExcludedFromBrowserBundles(resolverAttempt),
    ).toBe(true);
    expect(resolverAttempt.failureMessages.join("\n")).toMatch(
      /node:url|fileURLToPath|Browser polyfill/i,
    );

    // Pure contract helpers remain the only acquisition surface that can appear
    // in a client-safe chunk without Node filesystem / package-resolution code.
    const publicExportsAttempt =
      await bundleApiPackageAcquisitionModuleForBrowser({
        entrypoint: "src/lib/references/api-package-public-exports.ts",
      });
    expect(
      isApiPackageAcquisitionBrowserSafeBundleClean(publicExportsAttempt),
    ).toBe(true);
  });
});
