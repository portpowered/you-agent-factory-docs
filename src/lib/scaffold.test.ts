import { describe, expect, test } from "bun:test";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "./scaffold";

describe("scaffold smoke", () => {
  test("exports a stable scaffold identifier for CI health checks", () => {
    expect(SCAFFOLD_ID).toBe("you-agent-factory-scaffold");
  });

  test("exports site copy constants rendered on the home page", () => {
    expect(SITE_BRAND_NAME).toBe("you-agent-factory");
    expect(SITE_HEADING).toBe("you-agent-factory");
  });
});
