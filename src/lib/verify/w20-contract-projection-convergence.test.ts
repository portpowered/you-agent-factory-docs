import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listW20ContractProjectionCoveredFamilies,
  W20_CONTRACT_PROJECTION_REQUIRED_FAMILIES,
  W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS,
  W20_CONTRACT_PROJECTION_SUITE_COMMAND,
  W20_CONTRACT_PROJECTION_SUITE_ENTRIES,
  W20_CONTRACT_SUITE_ENTRIES,
  W20_PROJECTION_SUITE_ENTRIES,
} from "./w20-contract-projection-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 contract + projection convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_CONTRACT_PROJECTION_SUITE_COMMAND).toBe(
      "make test-w20-contract-projection",
    );
  });

  test("lists a non-empty set of existing contract and projection suite files", () => {
    expect(W20_CONTRACT_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_PROJECTION_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS.length).toBe(
      W20_CONTRACT_PROJECTION_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required contract and projection gate family", () => {
    const covered = listW20ContractProjectionCoveredFamilies();
    expect(covered).toEqual(
      [...W20_CONTRACT_PROJECTION_REQUIRED_FAMILIES].sort(),
    );

    for (const family of W20_CONTRACT_PROJECTION_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });

  test("contract suites cover public subpaths, membership, format versions, hashes, and missing-ref rejection", () => {
    const contractFamilies = new Set(
      W20_CONTRACT_SUITE_ENTRIES.flatMap((entry) => [...entry.families]),
    );

    expect(contractFamilies.has("contract-public-subpaths")).toBe(true);
    expect(contractFamilies.has("contract-manifest-membership")).toBe(true);
    expect(contractFamilies.has("contract-format-versions")).toBe(true);
    expect(contractFamilies.has("contract-consumed-hashes")).toBe(true);
    expect(contractFamilies.has("contract-missing-ref-rejection")).toBe(true);
  });

  test("projection suites cover OpenAPI, schema, CLI, MCP, JS, events, anchors, and search docs", () => {
    const projectionFamilies = new Set(
      W20_PROJECTION_SUITE_ENTRIES.flatMap((entry) => [...entry.families]),
    );

    expect(projectionFamilies.has("projection-openapi-operations")).toBe(true);
    expect(projectionFamilies.has("projection-schema-fields")).toBe(true);
    expect(projectionFamilies.has("projection-cli-commands")).toBe(true);
    expect(projectionFamilies.has("projection-mcp-tools")).toBe(true);
    expect(projectionFamilies.has("projection-javascript-symbols")).toBe(true);
    expect(projectionFamilies.has("projection-event-variants")).toBe(true);
    expect(projectionFamilies.has("projection-anchors")).toBe(true);
    expect(projectionFamilies.has("projection-search-documents")).toBe(true);
  });
});
