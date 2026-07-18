import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20PagesPrefixedCoveredFamilies,
  W20_PAGES_PREFIXED_BASE_PATH,
  W20_PAGES_PREFIXED_COMMAND_GATES,
  W20_PAGES_PREFIXED_LIVE_GATE_COMMANDS,
  W20_PAGES_PREFIXED_POST_COMMAND_SUITE_PATHS,
  W20_PAGES_PREFIXED_REQUIRED_FAMILIES,
  W20_PAGES_PREFIXED_REQUIRED_PROBE_NAV_HREFS,
  W20_PAGES_PREFIXED_REQUIRED_PROBE_ROUTES,
  W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS,
  W20_PAGES_PREFIXED_SUITE_COMMAND,
  W20_PAGES_PREFIXED_SUITE_ENTRIES,
} from "./w20-pages-prefixed-export-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 pages-prefixed export convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_PAGES_PREFIXED_SUITE_COMMAND).toBe(
      "make test-w20-pages-prefixed-export",
    );
  });

  test("locks the project-site base path", () => {
    expect(W20_PAGES_PREFIXED_BASE_PATH).toBe("/you-agent-factory-docs");
  });

  test("lists prefixed rebuild then deployed-artifact guard command gates", () => {
    expect(W20_PAGES_PREFIXED_COMMAND_GATES.length).toBe(2);

    const makeTargets = W20_PAGES_PREFIXED_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toEqual(["build", "guard-pages-deployed-artifact"]);

    const packageScripts = W20_PAGES_PREFIXED_COMMAND_GATES.map(
      (gate) => gate.packageScript,
    );
    expect(packageScripts).toEqual([
      "build:export",
      "guard:pages-deployed-artifact",
    ]);

    const buildGate = W20_PAGES_PREFIXED_COMMAND_GATES[0];
    expect(buildGate.env.GITHUB_PAGES_BASE_PATH).toBe(
      W20_PAGES_PREFIXED_BASE_PATH,
    );

    const guardGate = W20_PAGES_PREFIXED_COMMAND_GATES[1];
    expect(Object.keys(guardGate.env)).toEqual([]);
  });

  test("documents the live gate sequence without an intervening unprefixed rebuild", () => {
    expect([...W20_PAGES_PREFIXED_LIVE_GATE_COMMANDS]).toEqual([
      "GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build",
      "make guard-pages-deployed-artifact",
    ]);
  });

  test("lists a non-empty set of existing pages-prefixed suite files", () => {
    expect(W20_PAGES_PREFIXED_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS.length).toBe(
      W20_PAGES_PREFIXED_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required pages-prefixed gate family", () => {
    const covered = listW20PagesPrefixedCoveredFamilies();
    expect(covered).toEqual([...W20_PAGES_PREFIXED_REQUIRED_FAMILIES].sort());

    for (const family of W20_PAGES_PREFIXED_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("catalogues the Pages guard probe inventory (home, docs, blog)", () => {
    expect([...W20_PAGES_PREFIXED_REQUIRED_PROBE_ROUTES]).toEqual([
      "/",
      "/docs/guides/getting-started",
      "/blog/comparing-agent-factories",
    ]);
    expect([...W20_PAGES_PREFIXED_REQUIRED_PROBE_NAV_HREFS]).toEqual([
      "/",
      "/docs/guides/getting-started",
      "/blog/comparing-agent-factories",
    ]);

    expect(W20_PAGES_PREFIXED_POST_COMMAND_SUITE_PATHS).toContain(
      "src/lib/verify/w20-pages-prefixed-export-out-verify.test.ts",
    );
  });
});
