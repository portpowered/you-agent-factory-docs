import { describe, expect, test } from "bun:test";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  classifyShellViewport,
} from "../../src/lib/responsive-tokens";

describe("responsive tokens", () => {
  test("classifies mobile, tablet, and desktop from shared breakpoint rules", () => {
    expect(classifyShellViewport(320)).toBe("mobile");
    expect(classifyShellViewport(RESPONSIVE_BREAKPOINTS_PX.mobileMax)).toBe(
      "mobile",
    );
    expect(classifyShellViewport(RESPONSIVE_BREAKPOINTS_PX.mobileMax + 1)).toBe(
      "tablet",
    );
    expect(classifyShellViewport(RESPONSIVE_BREAKPOINTS_PX.tabletMax)).toBe(
      "tablet",
    );
    expect(classifyShellViewport(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1)).toBe(
      "desktop",
    );
  });
});
