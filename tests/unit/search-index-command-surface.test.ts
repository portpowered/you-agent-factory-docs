import { describe, expect, test } from "bun:test";
import { dryRunMake, runMake } from "../helpers/make";
import { runValidationScript } from "../helpers/validation";

describe("search index validation command surface", () => {
  test("make validate-search-index delegates to the bun validation script", () => {
    expect(dryRunMake("validate-search-index")).toContain(
      "bun run validate:search-index",
    );
  });

  test("validate:search-index succeeds on the current checked-in contract", () => {
    const result = runValidationScript("validate:search-index");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Search index validation passed");
  }, 120_000);

  test("make validate-search-index succeeds on the current checked-in contract", () => {
    const result = runMake("validate-search-index");

    expect(result.status).toBe(0);
  }, 120_000);
});
