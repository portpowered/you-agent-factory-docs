import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  CleanConsumerInstallError,
  installPackagedFactoryV002CleanConsumer,
  installTemporaryConsumerDependencies,
} from "./clean-consumer-install";
import {
  assertCleanConsumerManifestDocument,
  buildCleanConsumerManifest,
  CleanConsumerManifestError,
  FORBIDDEN_CONSUMER_MANIFEST_KEYS,
} from "./clean-consumer-manifest";
import {
  buildPackagedFactoryV002ExactPins,
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  PACKAGED_FACTORY_V002_VERSION,
} from "./five-package-pins";

describe("packaged-factory v0.0.2 clean-consumer install", () => {
  test("builds an exact-pin consumer manifest with no override redirects", () => {
    const manifest = buildCleanConsumerManifest();

    expect(manifest.private).toBe(true);
    expect(manifest.dependencies).toEqual(buildPackagedFactoryV002ExactPins());
    for (const key of FORBIDDEN_CONSUMER_MANIFEST_KEYS) {
      expect(key in manifest).toBe(false);
    }

    assertCleanConsumerManifestDocument(manifest);
  });

  test("rejects consumer manifests with overrides or link redirects", () => {
    expect(() =>
      assertCleanConsumerManifestDocument({
        ...buildCleanConsumerManifest(),
        overrides: {
          "@you-agent-factory/components": "0.0.0",
        },
      }),
    ).toThrow(CleanConsumerManifestError);

    expect(() =>
      assertCleanConsumerManifestDocument({
        name: "bad",
        private: true,
        version: "0.0.0",
        dependencies: {
          ...buildPackagedFactoryV002ExactPins(),
          "@you-agent-factory/components": "link:../components",
        },
      }),
    ).toThrow(/link\/file\/workspace redirects/);
  });

  test("installs the five packages at exact 0.0.2 from the registry without overrides", () => {
    const result = installPackagedFactoryV002CleanConsumer({
      keepOnSuccess: true,
    });

    try {
      expect(result.installedVersions).toEqual(
        buildPackagedFactoryV002ExactPins(),
      );

      for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
        const packageJsonPath = join(
          result.consumerDir,
          "node_modules",
          ...name.split("/"),
          "package.json",
        );
        const packageJson = JSON.parse(
          readFileSync(packageJsonPath, "utf8"),
        ) as { name?: string; version?: string };

        expect(packageJson.name).toBe(name);
        expect(packageJson.version).toBe(PACKAGED_FACTORY_V002_VERSION);
      }

      const consumerPackageJson = JSON.parse(
        readFileSync(join(result.consumerDir, "package.json"), "utf8"),
      ) as Record<string, unknown>;
      assertCleanConsumerManifestDocument(consumerPackageJson);
      expect(existsSync(join(result.consumerDir, "node_modules"))).toBe(true);
    } finally {
      rmSync(result.consumerDir, { recursive: true, force: true });
    }
  }, 180_000);

  test("fails closed when a required package version is unpublished", () => {
    const pins = buildPackagedFactoryV002ExactPins();
    let thrown: unknown;

    try {
      installTemporaryConsumerDependencies({
        packageJson: {
          name: "packaged-factory-v002-clean-consumer-unpublished",
          private: true,
          version: "0.0.0",
          dependencies: {
            ...pins,
            "@you-agent-factory/client":
              "0.0.2-unpublished-packaged-factory-proof",
          },
        },
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CleanConsumerInstallError);
    const failure = (thrown as CleanConsumerInstallError).failure;
    expect(failure.exitCode === null || failure.exitCode !== 0).toBe(true);
    expect(existsSync(failure.consumerDir)).toBe(false);
  }, 120_000);
});
