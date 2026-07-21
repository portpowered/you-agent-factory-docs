import { describe, expect, test } from "bun:test";
import {
  COMPARATIVE_CHART_FOCUS_COLORS,
  resolveBarFill,
  resolveFocusColor,
} from "./focus-colors";

describe("comparative chart focus colors", () => {
  test("resolveFocusColor accents the focused id and mutes others", () => {
    expect(resolveFocusColor("alpha", "alpha")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(resolveFocusColor("beta", "alpha")).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.muted,
    );
  });

  test("resolveFocusColor defaults to accent when focus id is omitted", () => {
    expect(resolveFocusColor("alpha", undefined)).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
    expect(resolveFocusColor("beta", undefined)).toBe(
      COMPARATIVE_CHART_FOCUS_COLORS.accent,
    );
  });

  test("resolveBarFill mutes non-focused series and accents focused series", () => {
    expect(
      resolveBarFill({
        seriesId: "model-a",
        categoryId: "input",
        focusSeriesId: "model-a",
      }),
    ).toBe(COMPARATIVE_CHART_FOCUS_COLORS.accent);
    expect(
      resolveBarFill({
        seriesId: "model-b",
        categoryId: "input",
        focusSeriesId: "model-a",
      }),
    ).toBe(COMPARATIVE_CHART_FOCUS_COLORS.muted);
  });

  test("resolveBarFill applies category focus within the focused series", () => {
    expect(
      resolveBarFill({
        seriesId: "model-a",
        categoryId: "input",
        focusSeriesId: "model-a",
        focusCategoryId: "input",
      }),
    ).toBe(COMPARATIVE_CHART_FOCUS_COLORS.accent);
    expect(
      resolveBarFill({
        seriesId: "model-a",
        categoryId: "output",
        focusSeriesId: "model-a",
        focusCategoryId: "input",
      }),
    ).toBe(COMPARATIVE_CHART_FOCUS_COLORS.muted);
    expect(
      resolveBarFill({
        seriesId: "model-b",
        categoryId: "input",
        focusSeriesId: "model-a",
        focusCategoryId: "input",
      }),
    ).toBe(COMPARATIVE_CHART_FOCUS_COLORS.muted);
  });
});
