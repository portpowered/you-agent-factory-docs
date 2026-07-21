import { describe, expect, test } from "bun:test";
import {
  AttributeFacetBar,
  DEFAULT_FOCUS_COLOR_TOKENS,
  FilterableSortableTable,
  type FocusColorTokens,
  focusFill,
  mutedFill,
  OrchestratorFeatureMatrix,
  resolveFocusColor,
} from "@/features/teaching-ui";
import { DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS } from "@/lib/theme/docs-chrome-highlighting-tokens";

describe("teaching-ui public barrel", () => {
  test("re-exports focus tokens and convenience fills", () => {
    expect(DEFAULT_FOCUS_COLOR_TOKENS.accent).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.secondaryBlue,
    );
    expect(DEFAULT_FOCUS_COLOR_TOKENS.muted).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.mutedWhite,
    );
    expect(focusFill).toBe(DEFAULT_FOCUS_COLOR_TOKENS.accent);
    expect(mutedFill).toBe(DEFAULT_FOCUS_COLOR_TOKENS.muted);
  });

  test("resolveFocusColor is importable via barrel and resolves accent vs muted", () => {
    const tokens: FocusColorTokens = DEFAULT_FOCUS_COLOR_TOKENS;
    expect(resolveFocusColor("a", "a", tokens)).toBe(tokens.accent);
    expect(resolveFocusColor("b", "a", tokens)).toBe(tokens.muted);
    expect(resolveFocusColor("a", undefined, tokens)).toBe(tokens.muted);
  });

  test("re-exports W-table recipe components", () => {
    expect(typeof FilterableSortableTable).toBe("function");
    expect(typeof AttributeFacetBar).toBe("function");
    expect(typeof OrchestratorFeatureMatrix).toBe("function");
  });
});
