import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  isDocumentationRouteMigrationLedgerFullyClosed,
  listOpenDocumentationRouteMigrationRows,
} from "@/lib/seo/documentation-route-migration";
import {
  evaluateOwnershipMigrationConvergence,
  listPlanSection9Routes,
  listPlanSection11ComponentNames,
  listW20OwnershipMigrationCoveredFamilies,
  W20_OWNERSHIP_MIGRATION_REQUIRED_FAMILIES,
  W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS,
  W20_OWNERSHIP_MIGRATION_SUITE_COMMAND,
  W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES,
  W20_PLAN_SECTION_9_EXPECTED_PAGE_COUNT,
  W20_PLAN_SECTION_9_PAGE_OWNERSHIP,
  W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP,
  W20_PLAN_SECTION_11_EXPECTED_COMPONENT_COUNT,
} from "./w20-ownership-migration-convergence";

const repoRoot = join(import.meta.dir, "../../..");

describe("W20 ownership + migration convergence catalog", () => {
  test("documents the maintainer reproduction command", () => {
    expect(W20_OWNERSHIP_MIGRATION_SUITE_COMMAND).toBe(
      "make test-w20-ownership-migration",
    );
  });

  test("covers every required ownership / migration gate family", () => {
    const covered = listW20OwnershipMigrationCoveredFamilies();
    expect(covered).toEqual(
      [...W20_OWNERSHIP_MIGRATION_REQUIRED_FAMILIES].sort(),
    );
  });

  test("locks plan §9 page ownership with no orphan or duplicate routes", () => {
    expect(W20_PLAN_SECTION_9_PAGE_OWNERSHIP.length).toBe(
      W20_PLAN_SECTION_9_EXPECTED_PAGE_COUNT,
    );
    expect(W20_PLAN_SECTION_9_EXPECTED_PAGE_COUNT).toBe(36);

    const routes = listPlanSection9Routes();
    expect(new Set(routes).size).toBe(routes.length);

    for (const row of W20_PLAN_SECTION_9_PAGE_OWNERSHIP) {
      expect(row.owner.length).toBeGreaterThan(0);
      expect(row.testSurface.length).toBeGreaterThan(0);
      expect(existsSync(join(repoRoot, row.testSurface))).toBe(true);
    }

    // Representative plan §9 anchors across all four families.
    expect(routes).toContain("/docs/references");
    expect(routes).toContain("/docs/references/api");
    expect(routes).toContain("/docs/references/events");
    expect(routes).toContain("/docs/factories");
    expect(routes).toContain("/docs/factories/configuration");
    expect(routes).toContain("/docs/workers");
    expect(routes).toContain("/docs/workers/agent");
    expect(routes).toContain("/docs/workstations");
    expect(routes).toContain("/docs/workstations/standard");
    expect(routes).toContain("/docs/workstations/classifier");
  });

  test("locks plan §11 component ownership with no orphan or duplicate names", () => {
    expect(W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP.length).toBe(
      W20_PLAN_SECTION_11_EXPECTED_COMPONENT_COUNT,
    );
    expect(W20_PLAN_SECTION_11_EXPECTED_COMPONENT_COUNT).toBeGreaterThan(50);

    const names = listPlanSection11ComponentNames();
    expect(new Set(names).size).toBe(names.length);

    for (const row of W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP) {
      expect(row.owner.length).toBeGreaterThan(0);
      expect(row.implementation.length).toBeGreaterThan(0);
      expect(row.testSurface.length).toBeGreaterThan(0);
      expect(existsSync(join(repoRoot, row.implementation))).toBe(true);
      expect(existsSync(join(repoRoot, row.testSurface))).toBe(true);
    }

    // Representative plan §11 anchors across acquisition / UI / overlay / reuse.
    expect(names).toContain("ApiPackageArtifactResolver");
    expect(names).toContain("ReferenceAnchorRegistry");
    expect(names).toContain("SchemaReference");
    expect(names).toContain("ApiOperationNavigator");
    expect(names).toContain("EventPayloadCatalog");
    expect(names).toContain("CliCommandReference");
    expect(names).toContain("FactoryVariantOverlayRegistry");
    expect(names).toContain("DataTable");
  });

  test("lists existing W18 migration closure suite files", () => {
    expect(W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES.length).toBeGreaterThan(0);
    expect(W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS.length).toBe(
      W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES.length,
    );

    for (const relativePath of W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }

    expect(new Set(W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS).size).toBe(
      W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS.length,
    );
  });

  test("evaluates ownership map complete with a fully closed W18 ledger", () => {
    const evaluation = evaluateOwnershipMigrationConvergence();
    expect(evaluation.pageCount).toBe(36);
    expect(evaluation.componentCount).toBe(
      W20_PLAN_SECTION_11_EXPECTED_COMPONENT_COUNT,
    );
    expect(evaluation.duplicatePageRoutes).toEqual([]);
    expect(evaluation.duplicateComponentNames).toEqual([]);
    expect(evaluation.missingOwners).toEqual([]);
    expect(evaluation.missingTestSurfaces).toEqual([]);
    expect(evaluation.orphanPageRoutes).toEqual([]);
    expect(evaluation.orphanComponentNames).toEqual([]);
    expect(evaluation.migrationLedgerFullyClosed).toBe(true);
    expect(evaluation.openMigrationRows).toBe(0);
    expect(evaluation.migrationLedgerRowCount).toBe(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(evaluation.expectedMigrationLedgerRowCount).toBe(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(evaluation.complete).toBe(true);

    expect(listOpenDocumentationRouteMigrationRows()).toEqual([]);
    expect(isDocumentationRouteMigrationLedgerFullyClosed()).toBe(true);
  });
});
