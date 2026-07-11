import { describe, expect, test } from "bun:test";
import {
  contrastRatio,
  meetsContrastRatio,
  parseCssColor,
  relativeLuminance,
} from "@/lib/theme/color-contrast";
import {
  HOST_SEMANTIC_CONTRAST_PAIRINGS,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";

describe("color contrast helpers", () => {
  test("parses hex and rgb colors and computes WCAG luminance", () => {
    expect(parseCssColor("#050b10")).toEqual({ r: 5, g: 11, b: 16 });
    expect(parseCssColor("rgb(245, 199, 111)")).toEqual({
      r: 245,
      g: 199,
      b: 111,
      a: 1,
    });
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  test("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(meetsContrastRatio("#000000", "#ffffff", 4.5)).toBe(true);
  });
});

describe("host semantic theme contrast (factory-dark)", () => {
  test("primary/secondary/foreground pairings meet readable dark-theme contrast", () => {
    const tokens = resolveHostSemanticThemeTokens();

    for (const pairing of HOST_SEMANTIC_CONTRAST_PAIRINGS) {
      const foreground = tokens[pairing.foreground];
      const background = tokens[pairing.background];
      const ratio = contrastRatio(foreground, background);

      expect(
        meetsContrastRatio(foreground, background, pairing.minimumRatio),
      ).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(pairing.minimumRatio);
    }
  });

  test("body text and yellow primary button stay well above AA text contrast", () => {
    const tokens = resolveHostSemanticThemeTokens();

    expect(contrastRatio(tokens.foreground, tokens.background)).toBeGreaterThan(
      10,
    );
    expect(
      contrastRatio(tokens["primary-foreground"], tokens.primary),
    ).toBeGreaterThan(4.5);
    // Cool secondary fill is intentionally ~4.48:1 with canvas ink.
    expect(
      contrastRatio(tokens["secondary-foreground"], tokens.secondary),
    ).toBeGreaterThan(4.4);
  });
});
