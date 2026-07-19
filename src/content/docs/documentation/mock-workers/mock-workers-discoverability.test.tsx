/**
 * Discoverability for migrated /docs/documentation/mock-workers is owned by the compatibility
 * page test and W18 link-retarget stories. This stub keeps the colocated
 * discoverability filename from asserting superseded documentation body copy.
 */
import { describe, expect, test } from "bun:test";
import { resolveDocumentationRouteMigrationTarget } from "@/lib/seo/documentation-route-migration";

describe("mock-workers documentation discoverability (compatibility)", () => {
  test("resolves the §10 family target from the migration ledger", () => {
    expect(
      resolveDocumentationRouteMigrationTarget(
        "/docs/documentation/mock-workers",
      ),
    ).toBe("/docs/workers/mock");
  });
});
