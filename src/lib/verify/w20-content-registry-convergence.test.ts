import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { publishedDocsIndex } from "@/lib/content/published-docs-registry-ids";
import {
  listW20ContentRegistryCoveredFamilies,
  publishedRoutePrefix,
  W20_CONTENT_REGISTRY_COMMAND_GATES,
  W20_CONTENT_REGISTRY_REQUIRED_FAMILIES,
  W20_CONTENT_REGISTRY_REQUIRED_TEST_PATHS,
  W20_CONTENT_REGISTRY_SUITE_COMMAND,
  W20_CONTENT_REGISTRY_SUITE_ENTRIES,
  W20_REQUIRED_PUBLISHED_ROUTE_URLS,
} from "./w20-content-registry-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 content + registry convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_CONTENT_REGISTRY_SUITE_COMMAND).toBe(
      "make test-w20-content-registry",
    );
  });

  test("lists validate-data and content-runtime completeness command gates", () => {
    expect(W20_CONTENT_REGISTRY_COMMAND_GATES.length).toBeGreaterThan(0);

    const makeTargets = W20_CONTENT_REGISTRY_COMMAND_GATES.map(
      (gate) => gate.makeTarget,
    );
    expect(makeTargets).toContain("validate-data");
    expect(makeTargets).toContain("verify-content-runtime-completeness");
  });

  test("lists a non-empty set of existing content/registry suite files", () => {
    expect(W20_CONTENT_REGISTRY_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_CONTENT_REGISTRY_REQUIRED_TEST_PATHS.length).toBe(
      W20_CONTENT_REGISTRY_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_CONTENT_REGISTRY_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });

  test("keeps suite paths unique", () => {
    const paths = W20_CONTENT_REGISTRY_REQUIRED_TEST_PATHS;
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("covers every required content/registry gate family", () => {
    const covered = listW20ContentRegistryCoveredFamilies();
    expect(covered).toEqual([...W20_CONTENT_REGISTRY_REQUIRED_FAMILIES].sort());

    for (const family of W20_CONTENT_REGISTRY_REQUIRED_FAMILIES) {
      expect(covered).toContain(family);
    }
  });
});

describe("W20 published Factory-reference route presence", () => {
  test("required published routes remain registered under references/factories/workers/workstations", () => {
    const registeredUrls = new Set(
      publishedDocsIndex.entries.map((entry) => entry.url),
    );

    const missing = W20_REQUIRED_PUBLISHED_ROUTE_URLS.filter(
      (url) => !registeredUrls.has(url),
    );
    expect(missing).toEqual([]);

    const prefixes = new Set(
      W20_REQUIRED_PUBLISHED_ROUTE_URLS.map((url) => publishedRoutePrefix(url)),
    );
    expect(prefixes.has("/docs/references/")).toBe(true);
    expect(prefixes.has("/docs/factories/")).toBe(true);
    expect(prefixes.has("/docs/workers/")).toBe(true);
    expect(prefixes.has("/docs/workstations/")).toBe(true);
  });

  test("published registry still exposes live entries for each Factory-reference section", () => {
    const bySection = {
      references: publishedDocsIndex.entries.filter(
        (entry) => entry.section === "references",
      ),
      factories: publishedDocsIndex.entries.filter(
        (entry) => entry.section === "factories",
      ),
      workers: publishedDocsIndex.entries.filter(
        (entry) => entry.section === "workers",
      ),
      workstations: publishedDocsIndex.entries.filter(
        (entry) => entry.section === "workstations",
      ),
    };

    expect(bySection.references.length).toBeGreaterThan(0);
    expect(bySection.factories.length).toBeGreaterThan(0);
    expect(bySection.workers.length).toBeGreaterThan(0);
    expect(bySection.workstations.length).toBeGreaterThan(0);

    for (const entry of [
      ...bySection.references,
      ...bySection.factories,
      ...bySection.workers,
      ...bySection.workstations,
    ]) {
      expect(entry.url.startsWith(`/docs/${entry.section}/`)).toBe(true);
    }
  });
});
