import { describe, expect, test } from "bun:test";
import { isFactoryCarouselHarnessEnabled } from "./factory-carousel-harness-gate";

describe("isFactoryCarouselHarnessEnabled", () => {
  test("allows non-production without the enable flag", () => {
    expect(isFactoryCarouselHarnessEnabled({ NODE_ENV: "development" })).toBe(
      true,
    );
    expect(isFactoryCarouselHarnessEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  test("blocks production unless ENABLE_COMPONENT_EXAMPLES=1", () => {
    expect(isFactoryCarouselHarnessEnabled({ NODE_ENV: "production" })).toBe(
      false,
    );
    expect(
      isFactoryCarouselHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "0",
      }),
    ).toBe(false);
    expect(
      isFactoryCarouselHarnessEnabled({
        NODE_ENV: "production",
        ENABLE_COMPONENT_EXAMPLES: "1",
      }),
    ).toBe(true);
  });
});
