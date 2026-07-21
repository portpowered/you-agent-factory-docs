import { describe, expect, test } from "bun:test";
import { staticExportNextConfig } from "@/lib/build/static-export";
import {
  DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS,
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER_SIZE,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
  documentationRouteMigrationOldRouteToSlug,
  findDocumentationRouteMigrationByOldRoute,
  isDocumentationRouteMigrationLedgerFullyClosed,
  isDocumentationRouteMigrationOldSlug,
  isDocumentationRouteStaticCompatibilityMechanismExportSafe,
  listClosedDocumentationRouteMigrationRows,
  listDocumentationRouteMigrationOldSlugs,
  listDocumentationRouteMigrationRows,
  listOpenDocumentationRouteMigrationRows,
  resolveDocumentationRouteMigrationTarget,
} from "@/lib/seo/documentation-route-migration";

/** Plan §10 / W00 baseline inventory — source of truth for ledger rows. */
const SECTION_10_EXPECTED_MAPPINGS = [
  ["/docs/documentation/api-doc", "/docs/references/api"],
  ["/docs/documentation/cli-command-index", "/docs/references/cli"],
  ["/docs/documentation/configuration", "/docs/factories/configuration"],
  [
    "/docs/documentation/global-configuration-factories",
    "/docs/factories/global-configuration",
  ],
  ["/docs/documentation/workers", "/docs/workers"],
  ["/docs/documentation/agent-workers", "/docs/workers/agent"],
  ["/docs/documentation/inference-workers", "/docs/workers/inference"],
  ["/docs/documentation/script-workers", "/docs/workers/script"],
  ["/docs/documentation/poller-workers", "/docs/workers/poller"],
  ["/docs/documentation/mock-workers", "/docs/workers/mock"],
  ["/docs/documentation/workstations", "/docs/workstations"],
] as const;

describe("documentation route migration ledger", () => {
  test("enumerates every §10 row with old route, target route, and status", () => {
    expect(DOCUMENTATION_ROUTE_MIGRATION_LEDGER_SIZE).toBe(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(SECTION_10_EXPECTED_MAPPINGS).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    const rows = listDocumentationRouteMigrationRows();
    expect(rows).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const [
      index,
      [oldRoute, targetRoute],
    ] of SECTION_10_EXPECTED_MAPPINGS.entries()) {
      const row = rows[index];
      expect(row).toBeDefined();
      expect(row?.oldRoute).toBe(oldRoute);
      expect(row?.targetRoute).toBe(targetRoute);
      expect(row?.status === "open" || row?.status === "closed").toBe(true);
    }
  });

  test("closes every §10 row after compatibility outcomes are proven", () => {
    expect(listOpenDocumentationRouteMigrationRows()).toEqual([]);
    expect(listClosedDocumentationRouteMigrationRows()).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(isDocumentationRouteMigrationLedgerFullyClosed()).toBe(true);

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      expect(row.status).toBe("closed");
    }
  });

  test("keeps old routes unique and resolvable to their family targets", () => {
    const oldRoutes = DOCUMENTATION_ROUTE_MIGRATION_LEDGER.map(
      (row) => row.oldRoute,
    );
    expect(new Set(oldRoutes).size).toBe(oldRoutes.length);

    for (const [oldRoute, targetRoute] of SECTION_10_EXPECTED_MAPPINGS) {
      expect(
        findDocumentationRouteMigrationByOldRoute(oldRoute)?.targetRoute,
      ).toBe(targetRoute);
      expect(resolveDocumentationRouteMigrationTarget(oldRoute)).toBe(
        targetRoute,
      );
    }

    expect(
      findDocumentationRouteMigrationByOldRoute("/docs/documentation/missing"),
    ).toBeUndefined();
    expect(
      resolveDocumentationRouteMigrationTarget("/docs/documentation/missing"),
    ).toBeUndefined();
  });

  test("maps every ledger old route to documentation catch-all slug segments", () => {
    const slugs = listDocumentationRouteMigrationOldSlugs();
    expect(slugs).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const [oldRoute] of SECTION_10_EXPECTED_MAPPINGS) {
      const slug = documentationRouteMigrationOldRouteToSlug(oldRoute);
      expect(slug?.[0]).toBe("documentation");
      expect(isDocumentationRouteMigrationOldSlug(slug)).toBe(true);
      expect(`/docs/${slug?.join("/")}`).toBe(oldRoute);
    }
  });
});

describe("documentation route static compatibility mechanism", () => {
  test("locks a static-export-safe compatibility document + canonical/sitemap pairing", () => {
    const mechanism = DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM;

    expect(mechanism.primaryOutcome).toBe("static-compatibility-document");
    expect(mechanism.seoPairing).toBe(
      "metadata-canonical-and-sitemap-exclusion",
    );
    expect(mechanism.requiresExplicitCompatibilityHtml).toBe(true);
    expect(mechanism.requiresNewFamilyCanonicalDeclaration).toBe(true);
    expect(mechanism.forbidsSilentRemovalOfPublishedOldRoute).toBe(true);
    expect(isDocumentationRouteStaticCompatibilityMechanismExportSafe()).toBe(
      true,
    );
  });

  test("forbids next.config, host _redirects, and runtime server redirects", () => {
    expect([
      ...DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS,
    ]).toEqual([
      "next.config-redirects",
      "host-_redirects",
      "runtime-server-redirects",
    ]);
    expect(
      DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM.forbiddenRedirectMechanisms,
    ).toEqual(DOCUMENTATION_ROUTE_MIGRATION_FORBIDDEN_REDIRECT_MECHANISMS);

    // Static export config ships HTML only — no redirects() wiring.
    expect(staticExportNextConfig.output).toBe("export");
    expect(Object.hasOwn(staticExportNextConfig, "redirects")).toBe(false);
  });

  test("rejects mechanism variants that allow silent removal or redirect hosts", () => {
    expect(
      isDocumentationRouteStaticCompatibilityMechanismExportSafe({
        ...DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
        forbidsSilentRemovalOfPublishedOldRoute: false,
      }),
    ).toBe(false);

    expect(
      isDocumentationRouteStaticCompatibilityMechanismExportSafe({
        ...DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
        requiresExplicitCompatibilityHtml: false,
      }),
    ).toBe(false);

    expect(
      isDocumentationRouteStaticCompatibilityMechanismExportSafe({
        ...DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM,
        forbiddenRedirectMechanisms: [
          "next.config-redirects",
          "host-_redirects",
        ],
      }),
    ).toBe(false);
  });
});
