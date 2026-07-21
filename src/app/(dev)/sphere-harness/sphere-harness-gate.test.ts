import { describe, expect, test } from "bun:test";
import { isSphereHarnessEnabled } from "./sphere-harness-gate";

describe("isSphereHarnessEnabled", () => {
  test("allows non-production without the enable flag", () => {
    expect(isSphereHarnessEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isSphereHarnessEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  test("blocks production unless ENABLE_COMPONENT_EXAMPLES=1", () => {
    expect(isSphereHarnessEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isSphereHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "0",
      }),
    ).toBe(false);
    expect(
      isSphereHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "1",
      }),
    ).toBe(true);
  });
});
