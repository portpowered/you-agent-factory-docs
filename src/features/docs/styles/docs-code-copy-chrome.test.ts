import { describe, expect, test } from "bun:test";
import {
  DOCS_CODE_COPY_BUTTON_CLASS,
  DOCS_CODE_COPY_CHROME_FACTORY_DARK,
  DOCS_CODE_COPY_CHROME_TOKENS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_IGNORE_SELECTOR,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_RESET_MS,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";

describe("docs code copy chrome contract", () => {
  test("interactive treatment uses semantic secondary (cool blue), not accent-ink", () => {
    expect(DOCS_CODE_COPY_CHROME_TOKENS.interactiveColor).toBe(
      "var(--secondary)",
    );
    expect(DOCS_CODE_COPY_CHROME_TOKENS.focusRing).toBe("var(--secondary)");
    expect(DOCS_CODE_COPY_CHROME_TOKENS.restColor).toBe(
      "var(--muted-foreground)",
    );
    expect(DOCS_CODE_COPY_CHROME_TOKENS.interactiveBackground).toContain(
      "var(--secondary)",
    );

    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).toBe(
      FACTORY_DARK_FOUNDATION.secondaryAccent,
    );
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).toBe("#507f8c");
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.restColor).toBe(
      FACTORY_DARK_FOUNDATION.secondaryAccentInk,
    );
    // Accent-ink is the Fumadocs hover trap that disappears on dark cards.
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).not.toBe(
      FACTORY_DARK_FOUNDATION.accentInk,
    );
  });

  test("copy control markers and copied-state labels are stable for DocsCodeBlock wiring", () => {
    expect(DOCS_CODE_COPY_CONTROL_ATTR).toBe("data-docs-code-copy");
    expect(DOCS_CODE_COPY_CONTROL_VALUE).toBe("control");
    expect(DOCS_CODE_COPY_BUTTON_CLASS).toBe("docs-code-block__copy-button");
    expect(DOCS_CODE_COPY_STATUS_ATTR).toBe("data-docs-code-copy-status");
    expect(DOCS_CODE_COPY_LABEL).toBe("Copy Text");
    expect(DOCS_CODE_COPY_COPIED_LABEL).toBe("Copied Text");
    expect(DOCS_CODE_COPY_RESET_MS).toBe(1500);
    expect(DOCS_CODE_COPY_IGNORE_SELECTOR).toBe(".nd-copy-ignore");
  });

  test("persistent visibility contract keeps secondary blue for hover focus and copied", () => {
    // Rest and interactive colors must both resolve to visible cool blues —
    // never transparent / accent-ink (the Fumadocs disappear-on-hover trap).
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.restColor).toMatch(/^#/);
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).toMatch(/^#/);
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.restColor).not.toBe(
      "transparent",
    );
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).not.toBe(
      "transparent",
    );
    expect(DOCS_CODE_COPY_CHROME_TOKENS.interactiveColor).toBe(
      "var(--secondary)",
    );
    expect(DOCS_CODE_COPY_CHROME_TOKENS.focusRing).toBe("var(--secondary)");
  });
});
