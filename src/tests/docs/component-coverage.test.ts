import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { COVERAGE_TEST_ARGS } from "@/lib/docs/component-coverage-gate";
import {
  REUSABLE_COVERAGE_COMPONENTS,
  REUSABLE_THIN_WRAPPERS,
} from "@/lib/docs/component-manifest";

const repoRoot = join(import.meta.dir, "../../..");
const coverageGateScriptPath = join(
  repoRoot,
  "scripts/component-coverage-gate.ts",
);

describe("component coverage contract", () => {
  test("manifest lists existing unit and a11y smoke test files", () => {
    for (const entry of REUSABLE_COVERAGE_COMPONENTS) {
      expect(existsSync(join(repoRoot, entry.file))).toBe(true);
      for (const testPath of entry.unitTests) {
        expect(existsSync(join(repoRoot, testPath))).toBe(true);
      }
    }

    for (const wrapper of REUSABLE_THIN_WRAPPERS) {
      expect(existsSync(join(repoRoot, wrapper.file))).toBe(true);
      for (const testPath of wrapper.smokeTests) {
        const normalized = testPath.replace(/\s+\(.*\)$/, "");
        expect(existsSync(join(repoRoot, normalized))).toBe(true);
      }
    }
  });

  test("reusable coverage no longer lists Atlas attention/registry graph components", () => {
    const coverageFiles = new Set(
      REUSABLE_COVERAGE_COMPONENTS.map((entry) => entry.file),
    );
    expect(
      coverageFiles.has(
        "src/features/models/components/AttentionVariantComparisonGraph.tsx",
      ),
    ).toBe(false);
    expect(
      coverageFiles.has("src/features/models/components/RegistryGraphFlow.tsx"),
    ).toBe(false);
  });

  test("factory-ui wrappers are registered as thin wrappers with smoke tests", () => {
    const thinWrapperFiles = REUSABLE_THIN_WRAPPERS.map((entry) => entry.file);
    expect(thinWrapperFiles).toContain("src/features/factory-ui/graphs.ts");
    expect(thinWrapperFiles).toContain("src/features/factory-ui/charts.ts");
    expect(thinWrapperFiles).toContain(
      "src/features/factory-ui/data-display.ts",
    );

    const factoryUiWrappers = REUSABLE_THIN_WRAPPERS.filter((entry) =>
      entry.file.startsWith("src/features/factory-ui/"),
    );
    expect(factoryUiWrappers.length).toBeGreaterThanOrEqual(3);
    for (const wrapper of factoryUiWrappers) {
      expect(wrapper.forwardsTo.length).toBeGreaterThan(0);
      expect(wrapper.smokeTests.length).toBeGreaterThan(0);
      for (const testPath of wrapper.smokeTests) {
        expect(existsSync(join(repoRoot, testPath))).toBe(true);
      }
    }
  });

  test("reachable line coverage minimums are enforced by make coverage, not nested bun test", () => {
    expect(existsSync(coverageGateScriptPath)).toBe(true);
    expect(COVERAGE_TEST_ARGS).toContain("--path-ignore-patterns");
    expect(COVERAGE_TEST_ARGS.join(" ")).toContain(
      "src/tests/docs/component-coverage.test.ts",
    );
  });
});
