/**
 * Pure projection proofs for the packaged-factories index view model.
 */
import { describe, expect, test } from "bun:test";
import generatedIndex from "./generated/index.json";
import {
  PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH,
  PackagedFactoryIndexProjectionError,
  projectPackagedFactoriesIndex,
  projectPackagedFactoryIndexEntry,
} from "./project-packaged-factories-index";

describe("projectPackagedFactoriesIndex", () => {
  test("projects the generated corpus in allowlist order with factory.json panels", () => {
    const view = projectPackagedFactoriesIndex(generatedIndex);

    expect(view.packageName).toBe("@you-agent-factory/packaged-factories");
    expect(view.packageVersion).toBe("0.0.2");
    expect(view.entries.map((entry) => entry.childSlug)).toEqual([
      "goal",
      "subagent",
      "fusion",
      "review",
      "quorum",
      "tts",
      "deep-research",
    ]);

    const goal = view.entries[0];
    expect(goal?.kind).toBe("factory-json");
    expect(goal?.canonicalName).toBe("@you/goal");
    expect(goal?.packagedDescription).toBeNull();
    expect(goal?.childHref).toBe(
      `${PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/goal`,
    );
    expect(goal?.anchorId).toBe("goal");
    expect(goal?.sourceKind).toBe("factory.json");
    expect(goal?.sourceRelativePath).toBe("factories/goal/factory.json");
    expect(goal?.definitionText).toContain('"name": "@you/goal"');
    expect(goal?.definitionText).toBe(
      generatedIndex.entries[0]?.factoryJsonText,
    );
  });

  test("projects a JavaScript-only entry with no-factory.json labeling fields", () => {
    const entry = projectPackagedFactoryIndexEntry({
      canonicalName: "@you/js-only",
      packagedDescription: null,
      childSlug: "js-only",
      packageVersion: "0.0.2",
      sourceRelativePath: "factories/js-only/index.js",
      javascriptSourceText: "export default function run() { return 1; }\n",
    });

    expect(entry.kind).toBe("javascript-only");
    if (entry.kind !== "javascript-only") {
      throw new Error("expected javascript-only entry");
    }
    expect(entry.hasNoFactoryJson).toBe(true);
    expect(entry.sourceKind).toBe("javascript");
    expect(entry.definitionText).toBe(
      "export default function run() { return 1; }\n",
    );
    expect(entry.childHref).toBe(
      `${PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/js-only`,
    );
  });

  test("fails closed when an entry has no definition source", () => {
    expect(() =>
      projectPackagedFactoryIndexEntry({
        canonicalName: "@you/empty",
        packagedDescription: null,
        childSlug: "empty",
        packageVersion: "0.0.2",
        sourceRelativePath: "factories/empty/missing.json",
      }),
    ).toThrow(PackagedFactoryIndexProjectionError);
  });
});
