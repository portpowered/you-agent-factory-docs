import { describe, expect, test } from "bun:test";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import { createHash } from "node:crypto";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  PackagedFactoriesFilesystemPullError,
  pullPackagedFactoriesAllowlistedFiles,
} from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import { acquirePackagedFactoryIndexCorpus } from "./acquire-index-corpus";
import {
  hashPackagedFactorySourceText,
  PackagedFactoryIndexCorpusError,
} from "./index-corpus-model";

describe("acquire packaged-factory index corpus (filesystem pull)", () => {
  test("acquires ordered allowlisted factory.json definitions with version and hashes", () => {
    const result = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });

    expect(result.pull.installedVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(result.pull.exportsMapAbsent).toBe(false);
    expect(result.corpus.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(result.corpus.exportsMapAbsent).toBe(false);
    expect(result.corpus.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(result.pull.required.map((file) => file.relativePath)).toEqual([
      ...PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
    ]);

    for (const entry of result.corpus.entries) {
      // 0.0.6 publishes bare factory names ("goal"); 0.0.2 scoped them
      // ("@you/goal"). The corpus takes the name verbatim from factory.json.
      expect(entry.canonicalName.length).toBeGreaterThan(0);
      expect(entry.canonicalName).toBe(entry.childSlug);
      expect(entry.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
      expect(entry.factoryJsonText.trim().length).toBeGreaterThan(0);
      expect(entry.factoryJson).toEqual(JSON.parse(entry.factoryJsonText));
      expect(entry.factoryJsonSha256).toBe(
        hashPackagedFactorySourceText(entry.factoryJsonText),
      );
      expect(entry.factoryJsonSha256).toBe(
        createHash("sha256")
          .update(entry.factoryJsonText, "utf8")
          .digest("hex"),
      );
      // 0.0.6 factory.json files publish a top-level description (0.0.2 did
      // not). The corpus passes it through verbatim and still never invents
      // narrative when the field is absent.
      expect(typeof entry.packagedDescription).toBe("string");
      expect((entry.packagedDescription ?? "").length).toBeGreaterThan(0);
    }

    const goal = result.corpus.entries[0];
    expect(goal?.childSlug).toBe("goal");
    expect(goal?.canonicalName).toBe("goal");
    expect(goal?.sourceRelativePath).toBe("generated/factories/goal/factory.json");
  });

  test("fails closed when an allowlisted required file is missing", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const missingGoal = {
      ...live,
      required: live.required.filter(
        (file) => file.relativePath !== "generated/factories/goal/factory.json",
      ),
    };

    expect(() =>
      acquirePackagedFactoryIndexCorpus({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => missingGoal,
      }),
    ).toThrow(PackagedFactoryIndexCorpusError);

    try {
      acquirePackagedFactoryIndexCorpus({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => missingGoal,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryIndexCorpusError);
      expect((error as PackagedFactoryIndexCorpusError).code).toBe(
        "missing-allowlisted-definition",
      );
    }
  });

  test("fails closed when installed version is not exact 0.0.2", () => {
    expect(() =>
      acquirePackagedFactoryIndexCorpus({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => {
          throw new PackagedFactoriesFilesystemPullError(
            "wrong-version",
            'Installed @you-agent-factory/packaged-factories reported version "9.9.9", expected exact "0.0.2".',
          );
        },
      }),
    ).toThrow(PackagedFactoriesFilesystemPullError);
  });

  test("fails closed on invalid factory definition text from pull", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const invalid = {
      ...live,
      required: live.required.map((file) =>
        file.relativePath === "generated/factories/goal/factory.json"
          ? { ...file, text: "{not-valid-json" }
          : file,
      ),
    };

    expect(() =>
      acquirePackagedFactoryIndexCorpus({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => invalid,
      }),
    ).toThrow(/did not parse as JSON/);
  });
});
