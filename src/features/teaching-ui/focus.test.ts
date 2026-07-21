import { describe, expect, test } from "bun:test";
import { DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS } from "@/lib/theme/docs-chrome-highlighting-tokens";
import {
  DEFAULT_FOCUS_COLOR_TOKENS,
  type FocusColorTokens,
  focusFill,
  mutedFill,
  resolveFocusColor,
} from "./focus";

const tokens: FocusColorTokens = DEFAULT_FOCUS_COLOR_TOKENS;

describe("teaching-ui focus color tokens", () => {
  test("default tokens reuse locked secondary blue and muted whitish CSS vars", () => {
    expect(DEFAULT_FOCUS_COLOR_TOKENS.accent).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.secondaryBlue,
    );
    expect(DEFAULT_FOCUS_COLOR_TOKENS.muted).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.mutedWhite,
    );
    expect(DEFAULT_FOCUS_COLOR_TOKENS.accent).toBe("var(--secondary)");
    expect(DEFAULT_FOCUS_COLOR_TOKENS.muted).toBe("var(--muted-foreground)");
    expect(DEFAULT_FOCUS_COLOR_TOKENS.accent).not.toMatch(/#[0-9a-f]/i);
    expect(DEFAULT_FOCUS_COLOR_TOKENS.muted).not.toMatch(/#[0-9a-f]/i);
  });

  test("focusFill and mutedFill expose accent and muted convenience values", () => {
    expect(focusFill).toBe(DEFAULT_FOCUS_COLOR_TOKENS.accent);
    expect(mutedFill).toBe(DEFAULT_FOCUS_COLOR_TOKENS.muted);
  });
});

describe("resolveFocusColor", () => {
  test("focused id → accent", () => {
    expect(resolveFocusColor("series-a", "series-a", tokens)).toBe(
      tokens.accent,
    );
  });

  test("non-focused id → muted", () => {
    expect(resolveFocusColor("series-b", "series-a", tokens)).toBe(
      tokens.muted,
    );
  });

  test("missing focus id → muted for compared ids", () => {
    expect(resolveFocusColor("series-a", undefined, tokens)).toBe(tokens.muted);
    expect(resolveFocusColor("series-b", undefined, tokens)).toBe(tokens.muted);
  });

  test("respects caller-supplied token pair", () => {
    const custom: FocusColorTokens = {
      accent: "var(--custom-accent)",
      muted: "var(--custom-muted)",
    };
    expect(resolveFocusColor("x", "x", custom)).toBe(custom.accent);
    expect(resolveFocusColor("x", "y", custom)).toBe(custom.muted);
  });
});
