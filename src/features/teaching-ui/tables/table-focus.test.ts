import { describe, expect, test } from "bun:test";
import { DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS } from "@/lib/theme/docs-chrome-highlighting-tokens";
import {
  resolveTableFocusColor,
  resolveTableRowFocusClassName,
  resolveTableRowFocusState,
  TABLE_FOCUS_COLOR_TOKENS,
  TABLE_ROW_FOCUS_CLASS,
} from "./table-focus";

describe("table-focus helpers", () => {
  test("default tokens reuse locked secondary blue and muted whitish CSS vars", () => {
    expect(TABLE_FOCUS_COLOR_TOKENS.accent).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.secondaryBlue,
    );
    expect(TABLE_FOCUS_COLOR_TOKENS.muted).toBe(
      DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.mutedWhite,
    );
  });

  test("resolveTableRowFocusState accents focused row and mutes siblings", () => {
    expect(resolveTableRowFocusState("row-a", "row-a")).toBe("accent");
    expect(resolveTableRowFocusState("row-b", "row-a")).toBe("muted");
  });

  test("resolveTableRowFocusState stays neutral when focusRowId is omitted", () => {
    expect(resolveTableRowFocusState("row-a", undefined)).toBe("neutral");
    expect(resolveTableRowFocusState("row-b", undefined)).toBe("neutral");
  });

  test("resolveTableRowFocusClassName maps to accent / muted / neutral markers", () => {
    expect(resolveTableRowFocusClassName("row-a", "row-a")).toBe(
      TABLE_ROW_FOCUS_CLASS.accent,
    );
    expect(resolveTableRowFocusClassName("row-b", "row-a")).toBe(
      TABLE_ROW_FOCUS_CLASS.muted,
    );
    expect(resolveTableRowFocusClassName("row-a", undefined)).toBe(
      TABLE_ROW_FOCUS_CLASS.neutral,
    );
    expect(resolveTableRowFocusClassName("row-a", "row-a")).toContain(
      "teaching-ui-focus-accent",
    );
    expect(resolveTableRowFocusClassName("row-b", "row-a")).toContain(
      "teaching-ui-focus-muted",
    );
  });

  test("resolveTableFocusColor returns accent for focus and muted otherwise", () => {
    expect(resolveTableFocusColor("row-a", "row-a")).toBe(
      TABLE_FOCUS_COLOR_TOKENS.accent,
    );
    expect(resolveTableFocusColor("row-b", "row-a")).toBe(
      TABLE_FOCUS_COLOR_TOKENS.muted,
    );
    expect(resolveTableFocusColor("row-a", undefined)).toBe(
      TABLE_FOCUS_COLOR_TOKENS.muted,
    );
  });
});
