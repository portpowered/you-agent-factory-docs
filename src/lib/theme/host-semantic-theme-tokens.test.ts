import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  FACTORY_DARK_FOUNDATION,
  FACTORY_DARK_FOUNDATION_CSS_VARS,
  HOST_SEMANTIC_THEME_TOKEN_NAMES,
  HOST_SEMANTIC_THEME_TOKEN_VARS,
  LEGACY_TEAL_CORAL_MARKERS,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";

function normalizeHex(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("#") && trimmed.length === 7) {
    return trimmed;
  }
  const rgb = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) {
    return trimmed;
  }
  const toHex = (channel: string) =>
    Number(channel).toString(16).padStart(2, "0");
  return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
}

describe("host semantic theme tokens (factory-dark)", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("resolves black/yellow/cool-blue product branding (not legacy teal/coral)", () => {
    const tokens = resolveHostSemanticThemeTokens();

    expect(tokens.background).toBe(FACTORY_DARK_FOUNDATION.background);
    expect(tokens.foreground).toBe(FACTORY_DARK_FOUNDATION.ink);
    expect(tokens.primary).toBe(FACTORY_DARK_FOUNDATION.accent);
    expect(tokens["primary-foreground"]).toBe(
      FACTORY_DARK_FOUNDATION.accentInk,
    );
    expect(tokens.secondary).toBe(FACTORY_DARK_FOUNDATION.secondaryAccent);
    expect(tokens["secondary-foreground"]).toBe(FACTORY_DARK_FOUNDATION.canvas);
    expect(tokens.accent).toBe(FACTORY_DARK_FOUNDATION.accentStrong);
    expect(tokens["accent-foreground"]).toBe(FACTORY_DARK_FOUNDATION.accentInk);
    expect(tokens.ring).toBe(FACTORY_DARK_FOUNDATION.accent);
    expect(tokens["sidebar-primary"]).toBe(FACTORY_DARK_FOUNDATION.accent);
    expect(tokens.border).toBe("rgba(255, 255, 255, 0.18)");

    expect(tokens.primary).not.toBe(LEGACY_TEAL_CORAL_MARKERS.primaryOklch);
    expect(tokens.accent).not.toBe(LEGACY_TEAL_CORAL_MARKERS.accentOklch);
    expect(tokens.primary.toLowerCase()).toBe("#f5c76f");
    expect(tokens.secondary.toLowerCase()).toBe("#507f8c");
    expect(tokens.background.toLowerCase()).toBe("#050b10");
  });

  test("host CSS var expressions reference package foundation keys only", () => {
    for (const name of HOST_SEMANTIC_THEME_TOKEN_NAMES) {
      const expression = HOST_SEMANTIC_THEME_TOKEN_VARS[name];
      expect(expression.includes("--color-af-foundation-")).toBe(true);
      expect(expression.includes("oklch(")).toBe(false);
    }

    expect(HOST_SEMANTIC_THEME_TOKEN_VARS.primary).toBe(
      `var(${FACTORY_DARK_FOUNDATION_CSS_VARS.accent})`,
    );
    expect(HOST_SEMANTIC_THEME_TOKEN_VARS.secondary).toBe(
      `var(${FACTORY_DARK_FOUNDATION_CSS_VARS.secondaryAccent})`,
    );
    expect(HOST_SEMANTIC_THEME_TOKEN_VARS.accent).toBe(
      `var(${FACTORY_DARK_FOUNDATION_CSS_VARS.accentStrong})`,
    );
    expect(HOST_SEMANTIC_THEME_TOKEN_VARS.border).toContain(
      FACTORY_DARK_FOUNDATION_CSS_VARS.overlay,
    );
  });

  test("chrome surfaces that consume semantic tokens paint factory-dark colors", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const tokens = resolveHostSemanticThemeTokens();

    const shell = document.createElement("div");
    shell.style.backgroundColor = tokens.background;
    shell.style.color = tokens.foreground;

    const primaryChip = document.createElement("button");
    primaryChip.style.backgroundColor = tokens.primary;
    primaryChip.style.color = tokens["primary-foreground"];

    const secondaryChip = document.createElement("button");
    secondaryChip.style.backgroundColor = tokens.secondary;
    secondaryChip.style.color = tokens["secondary-foreground"];

    document.body.append(shell, primaryChip, secondaryChip);

    expect(normalizeHex(shell.style.backgroundColor)).toBe("#050b10");
    expect(normalizeHex(shell.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(primaryChip.style.backgroundColor)).toBe("#f5c76f");
    expect(normalizeHex(primaryChip.style.color)).toBe("#1a2228");
    expect(normalizeHex(secondaryChip.style.backgroundColor)).toBe("#507f8c");
    expect(normalizeHex(secondaryChip.style.color)).toBe("#050b10");
  });
});
