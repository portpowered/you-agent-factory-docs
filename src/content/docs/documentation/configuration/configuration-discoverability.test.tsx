/**
 * Discoverability for migrated /docs/documentation/configuration is owned by the compatibility
 * page test and W18 link-retarget stories. This stub keeps the colocated
 * discoverability filename from asserting superseded documentation body copy.
 */
import { describe, expect, test } from "bun:test";
import { resolveDocumentationRouteMigrationTarget } from "@/lib/seo/documentation-route-migration";

describe("configuration documentation discoverability (compatibility)", () => {
  test("resolves the §10 family target from the migration ledger", () => {
    expect(
      resolveDocumentationRouteMigrationTarget(
        "/docs/documentation/configuration",
      ),
    ).toBe("/docs/factories/configuration");
  });
});
