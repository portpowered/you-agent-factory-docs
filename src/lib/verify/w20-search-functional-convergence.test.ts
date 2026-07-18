import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20SearchFunctionalCoveredFamilies,
  W20_SEARCH_FUNCTIONAL_COMMAND_GATES,
  W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES,
  W20_SEARCH_FUNCTIONAL_REQUIRED_FAMILIES,
  W20_SEARCH_FUNCTIONAL_REQUIRED_TEST_PATHS,
  W20_SEARCH_FUNCTIONAL_SUITE_COMMAND,
  W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES,
} from "./w20-search-functional-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 search functional convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_SEARCH_FUNCTIONAL_SUITE_COMMAND).toBe(
      "make test-w20-search-functional",
    );
  });

  test("lists the static-search command gate", () => {
    expect(W20_SEARCH_FUNCTIONAL_COMMAND_GATES.length).toBeGreaterThan(0);

    const makeTargets = W20_SEARCH_FUNCTIONAL_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toContain("test-website-static-search");

    const packageScripts = W20_SEARCH_FUNCTIONAL_COMMAND_GATES.map(
      (gate) => gate.packageScript,
    );
    expect(packageScripts).toContain("test:website:static-search");
  });

  test("lists a non-empty set of existing search suite files", () => {
    expect(W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_SEARCH_FUNCTIONAL_REQUIRED_TEST_PATHS.length).toBe(
      W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_SEARCH_FUNCTIONAL_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_SEARCH_FUNCTIONAL_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required search gate family", () => {
    const covered = listW20SearchFunctionalCoveredFamilies();
    expect(covered).toEqual(
      [...W20_SEARCH_FUNCTIONAL_REQUIRED_FAMILIES].sort(),
    );

    for (const family of W20_SEARCH_FUNCTIONAL_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("item deep-link suites cover operations, schema fields, CLI, MCP, JS, and events", () => {
    const itemFamilies = new Set(
      W20_SEARCH_FUNCTIONAL_SUITE_ENTRIES.flatMap((entry) => [
        ...entry.families,
      ]),
    );

    expect(itemFamilies.has("item-deep-link-operations")).toBe(true);
    expect(itemFamilies.has("item-deep-link-schema-fields")).toBe(true);
    expect(itemFamilies.has("item-deep-link-cli")).toBe(true);
    expect(itemFamilies.has("item-deep-link-mcp")).toBe(true);
    expect(itemFamilies.has("item-deep-link-javascript")).toBe(true);
    expect(itemFamilies.has("item-deep-link-events")).toBe(true);
    expect(itemFamilies.has("item-hits-above-page-crowding")).toBe(true);
    expect(itemFamilies.has("representative-item-queries")).toBe(true);
  });

  test("documents representative item deep-link query contracts", () => {
    expect(
      W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES.length,
    ).toBeGreaterThan(0);

    for (const entry of W20_SEARCH_FUNCTIONAL_REPRESENTATIVE_ITEM_QUERIES) {
      expect(entry.query.length).toBeGreaterThan(0);
      expect(entry.expectedUrl.includes("#")).toBe(true);
      expect(entry.expectedUrl.startsWith("/docs/references/")).toBe(true);
    }
  });
});
