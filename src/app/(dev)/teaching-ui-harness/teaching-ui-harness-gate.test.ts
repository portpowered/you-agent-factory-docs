import { describe, expect, test } from "bun:test";
import { isTeachingUiHarnessEnabled } from "./teaching-ui-harness-gate";

describe("isTeachingUiHarnessEnabled", () => {
  test("allows non-production without the enable flag", () => {
    expect(isTeachingUiHarnessEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isTeachingUiHarnessEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  test("blocks production unless ENABLE_COMPONENT_EXAMPLES=1", () => {
    expect(isTeachingUiHarnessEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isTeachingUiHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "0",
      }),
    ).toBe(false);
    expect(
      isTeachingUiHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "1",
      }),
    ).toBe(true);
  });
});
