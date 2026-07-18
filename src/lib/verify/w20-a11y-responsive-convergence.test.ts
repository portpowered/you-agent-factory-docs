import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  getW20A11yResponsiveBrowserVerifyViewport,
  listW20A11yResponsiveCoveredFamilies,
  W20_A11Y_RESPONSIVE_BROWSER_VERIFY,
  W20_A11Y_RESPONSIVE_COMMAND_GATES,
  W20_A11Y_RESPONSIVE_FOCUSED_PAYLOAD_BUDGET_ROUTE_IDS,
  W20_A11Y_RESPONSIVE_POST_COMMAND_SUITE_PATHS,
  W20_A11Y_RESPONSIVE_REQUIRED_FAMILIES,
  W20_A11Y_RESPONSIVE_REQUIRED_TEST_PATHS,
  W20_A11Y_RESPONSIVE_SUITE_COMMAND,
  W20_A11Y_RESPONSIVE_SUITE_ENTRIES,
} from "./w20-a11y-responsive-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 a11y / responsive convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_A11Y_RESPONSIVE_SUITE_COMMAND).toBe(
      "make test-w20-a11y-responsive",
    );
  });

  test("lists the make a11y command gate", () => {
    expect(W20_A11Y_RESPONSIVE_COMMAND_GATES.length).toBeGreaterThan(0);

    const makeTargets = W20_A11Y_RESPONSIVE_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toContain("a11y");

    const packageScripts = W20_A11Y_RESPONSIVE_COMMAND_GATES.map(
      (gate) => gate.packageScript,
    );
    expect(packageScripts).toContain("test:a11y");
  });

  test("lists a non-empty set of existing a11y / responsive suite files", () => {
    expect(W20_A11Y_RESPONSIVE_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_A11Y_RESPONSIVE_REQUIRED_TEST_PATHS.length).toBe(
      W20_A11Y_RESPONSIVE_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_A11Y_RESPONSIVE_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_A11Y_RESPONSIVE_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required a11y / responsive gate family", () => {
    const covered = listW20A11yResponsiveCoveredFamilies();
    expect(covered).toEqual([...W20_A11Y_RESPONSIVE_REQUIRED_FAMILIES].sort());

    for (const family of W20_A11Y_RESPONSIVE_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("keeps focused reference payload budgets catalogued without owning total-site budget", () => {
    expect(W20_A11Y_RESPONSIVE_FOCUSED_PAYLOAD_BUDGET_ROUTE_IDS).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
    ]);

    const payloadFamilies = W20_A11Y_RESPONSIVE_SUITE_ENTRIES.flatMap(
      (entry) => [...entry.families],
    );
    expect(payloadFamilies).toContain("focused-reference-payload-budgets");

    // Story 008 owns total-site `make budget`; this binder must not claim it.
    const makeTargets = W20_A11Y_RESPONSIVE_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).not.toContain("budget");
  });

  test("documents the narrow-width keyboard browser-path contract", () => {
    expect(W20_A11Y_RESPONSIVE_BROWSER_VERIFY.routeId).toBe("references-api");
    expect(W20_A11Y_RESPONSIVE_BROWSER_VERIFY.routePath).toBe(
      "/docs/references/api",
    );
    expect(W20_A11Y_RESPONSIVE_BROWSER_VERIFY.viewportId).toBe("mobile");
    expect(
      W20_A11Y_RESPONSIVE_BROWSER_VERIFY.primaryControlSelector.length,
    ).toBeGreaterThan(0);

    const viewport = getW20A11yResponsiveBrowserVerifyViewport();
    expect(viewport.id).toBe("mobile");
    expect(viewport.width).toBe(390);
    expect(viewport.height).toBe(844);

    expect(W20_A11Y_RESPONSIVE_POST_COMMAND_SUITE_PATHS).toContain(
      "src/lib/verify/w20-a11y-responsive-browser-verify.test.tsx",
    );
  });
});
