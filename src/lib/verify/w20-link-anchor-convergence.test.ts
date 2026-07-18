import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20LinkAnchorCoveredFamilies,
  W20_LINK_ANCHOR_COMMAND_GATES,
  W20_LINK_ANCHOR_REQUIRED_FAMILIES,
  W20_LINK_ANCHOR_REQUIRED_TEST_PATHS,
  W20_LINK_ANCHOR_SUITE_COMMAND,
  W20_LINK_ANCHOR_SUITE_ENTRIES,
} from "./w20-link-anchor-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 link + anchor convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_LINK_ANCHOR_SUITE_COMMAND).toBe("make test-w20-link-anchor");
  });

  test("lists the linkcheck command gate", () => {
    expect(W20_LINK_ANCHOR_COMMAND_GATES.length).toBeGreaterThan(0);

    const makeTargets = W20_LINK_ANCHOR_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toContain("linkcheck");
  });

  test("lists a non-empty set of existing link/anchor suite files", () => {
    expect(W20_LINK_ANCHOR_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_LINK_ANCHOR_REQUIRED_TEST_PATHS.length).toBe(
      W20_LINK_ANCHOR_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_LINK_ANCHOR_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_LINK_ANCHOR_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required link/anchor gate family", () => {
    const covered = listW20LinkAnchorCoveredFamilies();
    expect(covered).toEqual([...W20_LINK_ANCHOR_REQUIRED_FAMILIES].sort());

    for (const family of W20_LINK_ANCHOR_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("anchor suites cover operations, schema fields, CLI, MCP, JS, and events", () => {
    const anchorFamilies = new Set(
      W20_LINK_ANCHOR_SUITE_ENTRIES.flatMap((entry) => [...entry.families]),
    );

    expect(anchorFamilies.has("anchor-operations")).toBe(true);
    expect(anchorFamilies.has("anchor-schema-fields")).toBe(true);
    expect(anchorFamilies.has("anchor-cli")).toBe(true);
    expect(anchorFamilies.has("anchor-mcp")).toBe(true);
    expect(anchorFamilies.has("anchor-javascript")).toBe(true);
    expect(anchorFamilies.has("anchor-events")).toBe(true);
  });
});
