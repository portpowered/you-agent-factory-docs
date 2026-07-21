import { describe, expect, test } from "bun:test";
import {
  HOST_SEMANTIC_CONTRAST_PAIRINGS,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";
import {
  API_ACCENT_CSS_VARS,
  API_ACCENT_TOKEN_CLASSES,
  API_CODE_COPY_POLICY,
  API_METHOD_BADGE_TONE_CLASSES,
  API_SHIKI_OPTIONS,
  API_THEME_ROOT_ATTR,
  API_TOKEN_CLASSES,
  apiMethodBadgeToneClass,
  avoidsPrimaryAccentClasses,
  usesSemanticTokenClasses,
} from "./theme-tokens";

describe("W08 API theme tokens", () => {
  test("exposes a production theme root marker", () => {
    expect(API_THEME_ROOT_ATTR).toBe("data-api-reference-theme");
  });

  test("token classes avoid hard-coded page-only colors", () => {
    for (const className of Object.values(API_TOKEN_CLASSES)) {
      expect(usesSemanticTokenClasses(className)).toBe(true);
    }
    for (const className of Object.values(API_ACCENT_TOKEN_CLASSES)) {
      expect(usesSemanticTokenClasses(className)).toBe(true);
    }
    for (const className of Object.values(API_METHOD_BADGE_TONE_CLASSES)) {
      expect(usesSemanticTokenClasses(className)).toBe(true);
    }
    expect(usesSemanticTokenClasses("text-[#ff00aa]")).toBe(false);
    expect(usesSemanticTokenClasses("bg-[oklch(0.5_0.1_200)]")).toBe(false);
    expect(usesSemanticTokenClasses("bg-[rgb(255,0,0)]")).toBe(false);
  });

  test("accent roles use secondary / muted-secondary, not primary yellow", () => {
    expect(API_ACCENT_TOKEN_CLASSES.selected).toBe("text-secondary");
    expect(API_ACCENT_TOKEN_CLASSES.selectedBorder).toBe("border-secondary");
    expect(API_ACCENT_TOKEN_CLASSES.quiet).toBe("text-muted-foreground");
    expect(API_ACCENT_TOKEN_CLASSES.quietBorder).toBe("border-border");

    expect(API_ACCENT_CSS_VARS.selected).toBe("var(--secondary)");
    expect(API_ACCENT_CSS_VARS.quiet).toBe("var(--muted-foreground)");

    for (const className of Object.values(API_ACCENT_TOKEN_CLASSES)) {
      expect(avoidsPrimaryAccentClasses(className)).toBe(true);
      expect(className).not.toMatch(/\bprimary\b/);
    }

    // Host primary may remain as a non-accent alias, but must not be the
    // documented accent role for tabs / badges / chips.
    expect(API_TOKEN_CLASSES.primary).toBe("text-primary");
    expect(API_TOKEN_CLASSES.secondary).toBe("text-secondary");
    expect(API_ACCENT_TOKEN_CLASSES.selected).not.toBe(
      API_TOKEN_CLASSES.primary,
    );
  });

  test("method badge tones resolve by HTTP method with secondary accent chrome", () => {
    expect(apiMethodBadgeToneClass("get")).toBe(
      API_METHOD_BADGE_TONE_CLASSES.get,
    );
    expect(apiMethodBadgeToneClass("POST")).toBe(
      API_METHOD_BADGE_TONE_CLASSES.post,
    );
    expect(apiMethodBadgeToneClass("delete")).toBe(
      API_METHOD_BADGE_TONE_CLASSES.delete,
    );
    expect(apiMethodBadgeToneClass("options")).toBe(
      API_METHOD_BADGE_TONE_CLASSES.default,
    );

    for (const [key, className] of Object.entries(
      API_METHOD_BADGE_TONE_CLASSES,
    )) {
      expect(avoidsPrimaryAccentClasses(className)).toBe(true);
      expect(className).not.toMatch(/\btext-primary\b/);
      if (key === "default") {
        expect(className).toContain(API_ACCENT_TOKEN_CLASSES.quiet);
      } else {
        expect(className).toContain(API_ACCENT_TOKEN_CLASSES.selected);
      }
    }
  });

  test("code-copy policy reuses CodePanel + useCopyButton (no second widget)", () => {
    expect(API_CODE_COPY_POLICY.surface).toBe("CodePanel");
    expect(API_CODE_COPY_POLICY.surfaceImport).toBe(
      "@/features/factory-ui/data-display",
    );
    expect(API_CODE_COPY_POLICY.copyHook).toBe(
      "fumadocs-ui/utils/use-copy-button",
    );
    expect(API_CODE_COPY_POLICY.inventsSecondCopyWidget).toBe(false);
  });

  test("shiki options wire dual light/dark themes without defaultColor lock", () => {
    expect(API_SHIKI_OPTIONS.themes.light).toBe("github-light");
    expect(API_SHIKI_OPTIONS.themes.dark).toBe("github-dark");
    expect(API_SHIKI_OPTIONS.defaultColor).toBe(false);
  });

  test("factory-dark host contrast pairings remain readable for API chrome", () => {
    const tokens = resolveHostSemanticThemeTokens();
    for (const pairing of HOST_SEMANTIC_CONTRAST_PAIRINGS) {
      const fg = tokens[pairing.foreground];
      const bg = tokens[pairing.background];
      expect(fg.startsWith("#") || fg.startsWith("rgba")).toBe(true);
      expect(bg.startsWith("#") || bg.startsWith("rgba")).toBe(true);
      expect(pairing.minimumRatio).toBeGreaterThan(0);
    }
  });
});
