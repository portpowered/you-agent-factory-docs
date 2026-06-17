import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dryRunMake, runMake } from "../helpers/make";
import {
  extractQualityGateStepNames,
  runQualityGateScript,
} from "../helpers/validation";

describe("early foundation quality gate command surface", () => {
  test("make quality-gate delegates to the bun quality-gate script", () => {
    expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
  });

  test("quality-gate subprocess output shows foundational checks in enforced order", () => {
    const result = runQualityGateScript();

    expect(result.status).toBe(0);
    expect(extractQualityGateStepNames(result.stdout)).toEqual([
      "typecheck",
      "lint",
      "localization validation",
      "content validation",
      "focused accessibility validation",
      "static export correctness",
      "foundation unit tests",
    ]);
  }, 180_000);

  test("make quality-gate succeeds when the generated search artifact is missing on a clean checkout", () => {
    const missingArtifactPath = join(
      mkdtempSync(join(tmpdir(), "missing-public-search-artifact-")),
      "public-search-index.json",
    );
    const result = runMake("quality-gate", {
      env: {
        PUBLIC_SEARCH_ARTIFACT_DEFAULT_PATH: missingArtifactPath,
      },
    });

    expect(result.status).toBe(0);
  }, 180_000);
});
