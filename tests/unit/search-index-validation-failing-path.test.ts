import { describe, expect, test } from "bun:test";
import { runValidationScript } from "../helpers/validation";

describe("search index validation failing-path proof", () => {
  test("validate:search-index blocks a checked-in artifact drift regression", () => {
    const result = runValidationScript(
      "validate:search-index",
      "broken-search-artifact",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Search index validation failed");
    expect(result.stderr).toContain("is missing generated entry");
  });

  test("validate:search-index reports malformed artifact structure clearly", () => {
    const result = runValidationScript(
      "validate:search-index",
      "broken-search-artifact-structure",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Search index validation failed");
    expect(result.stderr).toContain("failed contract validation");
    expect(result.stderr).toContain('must include an "entries" array');
  });

  test("validate:search-index reports normalized contract field mismatches clearly", () => {
    const result = runValidationScript(
      "validate:search-index",
      "broken-search-contract-field",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Search index validation failed");
    expect(result.stderr).toContain("normalized contract mismatch");
    expect(result.stderr).toContain("field title");
  });

  test("validate:search-index reports excluded-entry regressions clearly", () => {
    const result = runValidationScript(
      "validate:search-index",
      "broken-search-exclusion",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Search index validation failed");
    expect(result.stderr).toContain("includes excluded doc entry");
    expect(result.stderr).toContain("status: draft");
  });
});
