import { describe, expect, test } from "bun:test";
import { PROJECT_NAME, PROJECT_TAGLINE } from "../../src/lib/project";

describe("project metadata", () => {
  test("exposes a non-empty project name", () => {
    expect(PROJECT_NAME.length).toBeGreaterThan(0);
  });

  test("exposes a non-empty tagline", () => {
    expect(PROJECT_TAGLINE.length).toBeGreaterThan(0);
  });
});
