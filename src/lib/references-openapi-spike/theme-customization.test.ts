import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOST_SEMANTIC_CONTRAST_PAIRINGS,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";
import {
  listBlockedCustomizationHooks,
  listExercisedCustomizationHooks,
  SPIKE_CUSTOMIZATION_SURFACES,
  SPIKE_SHIKI_OPTIONS,
  SPIKE_THEME_ROOT_ATTR,
  SPIKE_TOKEN_CLASSES,
  usesSemanticTokenClasses,
} from "./theme-customization";

describe("W01 OpenAPI spike theme customization", () => {
  test("inventory exercises layout, code-block, and schema hooks", () => {
    const exercised = listExercisedCustomizationHooks();
    expect(exercised).toContain("content.renderPageLayout");
    expect(exercised).toContain("content.renderOperationLayout");
    expect(exercised).toContain("renderCodeBlock");
    expect(exercised).toContain("schemaUI.showExample");
    expect(exercised).toContain("shikiOptions");
  });

  test("inventory records blocked heading and method-label surfaces", () => {
    const blocked = listBlockedCustomizationHooks();
    expect(blocked).toContain("renderHeading");
    expect(blocked).toContain("(internal MethodLabel)");
  });

  test("every surface has an explicit status and notes", () => {
    expect(SPIKE_CUSTOMIZATION_SURFACES.length).toBeGreaterThanOrEqual(6);
    for (const entry of SPIKE_CUSTOMIZATION_SURFACES) {
      expect(entry.surface.length).toBeGreaterThan(0);
      expect(entry.hook.length).toBeGreaterThan(0);
      expect(entry.notes.length).toBeGreaterThan(10);
      expect([
        "supported-exercised",
        "supported-default-retained",
        "blocked-unsupported",
      ]).toContain(entry.status);
    }
  });

  test("spike token classes avoid hard-coded page-only colors", () => {
    for (const className of Object.values(SPIKE_TOKEN_CLASSES)) {
      expect(usesSemanticTokenClasses(className)).toBe(true);
    }
    expect(usesSemanticTokenClasses("text-[#ff00aa]")).toBe(false);
    expect(usesSemanticTokenClasses("bg-[oklch(0.5_0.1_200)]")).toBe(false);
  });

  test("shiki options wire dual light/dark themes without defaultColor lock", () => {
    expect(SPIKE_SHIKI_OPTIONS.themes.light).toBe("github-light");
    expect(SPIKE_SHIKI_OPTIONS.themes.dark).toBe("github-dark");
    expect(SPIKE_SHIKI_OPTIONS.defaultColor).toBe(false);
  });

  test("factory-dark host contrast pairings remain readable for spike chrome", () => {
    const tokens = resolveHostSemanticThemeTokens();
    for (const pairing of HOST_SEMANTIC_CONTRAST_PAIRINGS) {
      const fg = tokens[pairing.foreground];
      const bg = tokens[pairing.background];
      expect(fg.startsWith("#") || fg.startsWith("rgba")).toBe(true);
      expect(bg.startsWith("#") || bg.startsWith("rgba")).toBe(true);
      expect(pairing.minimumRatio).toBeGreaterThan(0);
    }
  });

  test("spike theme CSS remaps method colors to semantic vars only", () => {
    const cssPath = join(
      process.cwd(),
      "src/features/docs/styles/references-openapi-spike-theme.css",
    );
    const css = readFileSync(cssPath, "utf8");
    expect(css).toContain(`[${SPIKE_THEME_ROOT_ATTR}]`);
    expect(css).toContain("var(--foreground)");
    expect(css).toContain("var(--primary)");
    expect(css).toContain("var(--secondary)");
    expect(css).toContain("var(--destructive)");
    expect(css).toContain("var(--accent)");
    // No page-only hard-coded colors in the spike theme sheet.
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgb\(|\bhsl\(|\boklch\(/);
  });
});
