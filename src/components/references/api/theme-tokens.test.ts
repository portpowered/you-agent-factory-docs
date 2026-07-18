import { describe, expect, test } from "bun:test";
import {
  HOST_SEMANTIC_CONTRAST_PAIRINGS,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";
import {
  API_CODE_COPY_POLICY,
  API_METHOD_BADGE_TONE_CLASSES,
  API_SHIKI_OPTIONS,
  API_THEME_ROOT_ATTR,
  API_TOKEN_CLASSES,
  apiMethodBadgeToneClass,
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
    for (const className of Object.values(API_METHOD_BADGE_TONE_CLASSES)) {
      expect(usesSemanticTokenClasses(className)).toBe(true);
    }
    expect(usesSemanticTokenClasses("text-[#ff00aa]")).toBe(false);
    expect(usesSemanticTokenClasses("bg-[oklch(0.5_0.1_200)]")).toBe(false);
    expect(usesSemanticTokenClasses("bg-[rgb(255,0,0)]")).toBe(false);
  });

  test("method badge tones resolve by HTTP method with text-safe chrome", () => {
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
