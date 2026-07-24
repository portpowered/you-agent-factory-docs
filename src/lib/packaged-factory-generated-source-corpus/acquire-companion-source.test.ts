import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  PackagedFactoriesFilesystemPullError,
  pullPackagedFactoriesAllowlistedFiles,
} from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import {
  acquireDeepResearchCompanionSource,
  buildDeepResearchCompanionSourceFromPull,
  companionSourceTextFromPackagedFactoriesPull,
} from "./acquire-companion-source";
import {
  DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
  PackagedFactoryCompanionSourceError,
} from "./companion-source-model";
import { hashPackagedFactorySourceText } from "./index-corpus-model";

describe("acquire deep-research companion source (filesystem pull)", () => {
  test("acquires complete raw companion JS with metadata and hash from installed 0.0.2", () => {
    const result = acquireDeepResearchCompanionSource({
      consumerDir: getProjectRoot(),
    });

    expect(result.pull.installedVersion).toBe("0.0.2");
    expect(result.companion.packageVersion).toBe("0.0.2");
    expect(result.companion.childSlug).toBe("deep-research");
    expect(result.companion.canonicalName).toBe("@you/deep-research");
    expect(result.companion.sourceKind).toBe("companion-javascript");
    expect(result.companion.relativePath).toBe(
      DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    );
    expect(result.companion.sourceText.trim().length).toBeGreaterThan(0);
    expect(result.companion.sourceText).toContain("return (async function");
    expect(result.companion.sourceSha256).toBe(
      hashPackagedFactorySourceText(result.companion.sourceText),
    );
    expect(result.companion.sourceSha256).toBe(
      createHash("sha256")
        .update(result.companion.sourceText, "utf8")
        .digest("hex"),
    );

    // Live pull must surface the companion under optionalPresent; corpus
    // acquisition then treats it as required (fail closed if absent).
    expect(
      result.pull.optionalPresent.map((file) => file.relativePath),
    ).toContain(DEEP_RESEARCH_COMPANION_RELATIVE_PATH);
  });

  test("preserves exact companion bytes from the installed package without interpreting them", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const pulled = live.optionalPresent.find(
      (file) => file.relativePath === DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    );
    expect(pulled).toBeDefined();
    if (pulled === undefined) {
      throw new Error("expected deep-research companion in optionalPresent");
    }

    const companion = buildDeepResearchCompanionSourceFromPull(live);
    expect(companion.sourceText).toBe(pulled.text);
    expect(companion.sourceSha256).toBe(
      createHash("sha256").update(pulled.text, "utf8").digest("hex"),
    );
    // No derived analysis fields — only raw text + straightforward metadata.
    expect(Object.keys(companion).sort()).toEqual(
      [
        "canonicalName",
        "childSlug",
        "formatVersion",
        "packageVersion",
        "relativePath",
        "sourceKind",
        "sourceSha256",
        "sourceText",
      ].sort(),
    );
  });

  test("fails closed when allowlisted companion path is missing — never invents substitute", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const missingCompanion = {
      ...live,
      optionalPresent: [],
    };

    expect(() =>
      companionSourceTextFromPackagedFactoriesPull(missingCompanion),
    ).toThrow(/refusing to invent substitute source/);

    expect(() =>
      acquireDeepResearchCompanionSource({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => missingCompanion,
      }),
    ).toThrow(PackagedFactoryCompanionSourceError);

    try {
      acquireDeepResearchCompanionSource({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => missingCompanion,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCompanionSourceError);
      expect((error as PackagedFactoryCompanionSourceError).code).toBe(
        "missing-allowlisted-companion",
      );
      expect((error as PackagedFactoryCompanionSourceError).relativePath).toBe(
        DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
      );
    }
  });

  test("fails closed when installed version is not exact 0.0.2", () => {
    expect(() =>
      acquireDeepResearchCompanionSource({
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

  test("fails closed when deep-research factory.json name metadata is invalid", () => {
    const live = pullPackagedFactoriesAllowlistedFiles(getProjectRoot());
    const invalidName = {
      ...live,
      required: live.required.map((file) =>
        file.relativePath === "factories/deep-research/factory.json"
          ? { ...file, text: JSON.stringify({ id: "builtin-deep-research" }) }
          : file,
      ),
    };

    expect(() =>
      acquireDeepResearchCompanionSource({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => invalidName,
      }),
    ).toThrow(/missing a non-empty string "name"/);

    try {
      acquireDeepResearchCompanionSource({
        consumerDir: getProjectRoot(),
        pullAllowlistedFiles: () => invalidName,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCompanionSourceError);
      expect((error as PackagedFactoryCompanionSourceError).code).toBe(
        "invalid-companion-metadata",
      );
    }
  });
});
