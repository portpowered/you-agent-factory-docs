/**
 * Discoverability for migrated /docs/documentation/factory-session is owned by the compatibility
 * page test and W18 link-retarget stories. This stub keeps the colocated
 * discoverability filename from asserting superseded documentation body copy.
 */
import { describe, expect, test } from "bun:test";
import { resolveDocumentationRouteMigrationTarget } from "@/lib/seo/documentation-route-migration";

describe("factory-session documentation discoverability (compatibility)", () => {
  test("resolves the §10 family target from the migration ledger", () => {
    expect(
      resolveDocumentationRouteMigrationTarget(
        "/docs/documentation/factory-session",
      ),
    ).toBe("/docs/factories/sessions");
  });
});
