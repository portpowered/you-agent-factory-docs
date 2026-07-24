import { describe, expect, test } from "bun:test";
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

    expect(result.pull.installedVersion).toBe("0.0.2");
    expect(result.pull.exportsMapAbsent).toBe(true);
    expect(result.corpus.packageVersion).toBe("0.0.2");
    expect(result.corpus.exportsMapAbsent).toBe(true);
    expect(result.corpus.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(result.pull.required.map((file) => file.relativePath)).toEqual([
      ...PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS,
    ]);

    for (const entry of result.corpus.entries) {
      expect(entry.canonicalName.startsWith("@you/")).toBe(true);
      expect(entry.packageVersion).toBe("0.0.2");
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
      // 0.0.2 factory.json files do not publish a top-level description;
      // packaged description must stay null (no invented narrative).
      expect(entry.packagedDescription).toBeNull();
    }

    const goal = result.corpus.entries[0];
    expect(goal?.childSlug).toBe("goal");
    expect(goal?.canonicalName).toBe("@you/goal");
    expect(goal?.sourceRelativePath).toBe("factories/goal/factory.json");
  });

  test("fails closed when an allowlisted required file is missing", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const missingGoal = {
      ...live,
      required: live.required.filter(
        (file) => file.relativePath !== "factories/goal/factory.json",
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
        file.relativePath === "factories/goal/factory.json"
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
