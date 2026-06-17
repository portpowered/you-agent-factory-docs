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
    expect(result.stderr).toContain("does not match generated artifact");
  });
});
