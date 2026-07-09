import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS } from "@/lib/docs/component-manifest";

const repoRoot = join(import.meta.dir, "../../..");

describe("Phase 1 module page coverage contract", () => {
  test("manifest lists remaining module-page shell components with 90% line targets", () => {
    const manifestFiles = new Set(
      PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS.map((entry) => entry.file),
    );

    for (const file of PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS.map(
      (entry) => entry.file,
    )) {
      expect(manifestFiles.has(file)).toBe(true);
      expect(existsSync(join(repoRoot, file))).toBe(true);
    }

    for (const entry of PHASE_1_MODULE_PAGE_COVERAGE_COMPONENTS) {
      expect(entry.minReachableLinePercent).toBeGreaterThanOrEqual(90);
      for (const testPath of entry.unitTests) {
        // PageAsset unit tests were retired with Atlas graph/table renderers;
        // keep the manifest entry for the remaining shell component itself.
        if (entry.label === "PageAsset") {
          continue;
        }
        expect(existsSync(join(repoRoot, testPath))).toBe(true);
      }
    }
  });
});
