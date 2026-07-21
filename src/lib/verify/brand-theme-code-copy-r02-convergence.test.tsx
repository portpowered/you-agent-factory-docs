/**
 * R02 story 003 — brand, alignment, factory-dark theme, and accessible
 * code-copy contracts on the combined R00 + R01 tip.
 *
 * Locks reader-visible shell contracts without re-authoring product pages.
 */
import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  DOCS_CODE_BLOCK_INSET_INLINE,
  DocsPre,
} from "@/features/docs/components/DocsCodeBlock";
import {
  DOCS_CODE_COPY_CHROME_FACTORY_DARK,
  DOCS_CODE_COPY_CHROME_TOKENS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";
import {
  DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS,
  DOCS_HEADER_SHELL_CLASS,
} from "@/features/layout/docs-header";
import { DOCS_PAGE_TREE_ROOT_NAME } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  CONTENT_COLUMN_CONSUMER_SURFACES,
  CONTENT_COLUMN_INSET_CLASS,
  usesNegativeMarginCompensation,
} from "@/lib/layout/content-column-alignment";
import {
  BRAND_ALIGNMENT_EXPECTED_BRAND,
  BRAND_ALIGNMENT_VERIFICATION_ROUTES,
} from "@/lib/layout/content-column-brand-alignment-coverage";
import { SITE_BRAND_NAME } from "@/lib/scaffold";
import {
  FACTORY_DARK_FOUNDATION,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";
import {
  THEME_CODE_COPY_R00_PALETTE_ATTR,
  THEME_CODE_COPY_R00_ROUTE,
} from "@/lib/verify/theme-code-copy-r00-gate";

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

describe("R02 brand / alignment / theme / code-copy convergence", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("header chrome mark is YOU; explorer root and home title keep full product name", async () => {
    expect(SITE_BRAND_NAME).toBe("YOU");
    expect(BRAND_ALIGNMENT_EXPECTED_BRAND).toBe("YOU");
    expect(DOCS_PAGE_TREE_ROOT_NAME).toBe("You Agent Factory");

    const messages = await loadUiMessages("en");
    expect(messages.home.title).toBe("You Agent Factory");
  });

  test("home / browse / blog / docs share content-column alignment surfaces", () => {
    expect([...CONTENT_COLUMN_CONSUMER_SURFACES]).toEqual([
      "header-docs-nav",
      "home-article-browse",
      "browse-index",
      "blog-index",
      "docs-page",
    ]);

    const routeIds = BRAND_ALIGNMENT_VERIFICATION_ROUTES.map(
      (route) => route.id,
    );
    expect(routeIds).toEqual(["home", "browse", "blog", "docs-page"]);
    expect(
      BRAND_ALIGNMENT_VERIFICATION_ROUTES.map((route) => route.path),
    ).toEqual(["/", "/browse", "/blog", THEME_CODE_COPY_R00_ROUTE]);

    expect(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_INSET_CLASS,
    );
    expect(
      usesNegativeMarginCompensation(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS),
    ).toBe(false);
    expect(DOCS_HEADER_SHELL_CLASS).toContain("md:gap-0");
    expect(usesNegativeMarginCompensation(DOCS_HEADER_SHELL_CLASS)).toBe(false);
  });

  test("factory-dark black/yellow semantic theme remains canonical", () => {
    const tokens = resolveHostSemanticThemeTokens();
    expect(THEME_CODE_COPY_R00_PALETTE_ATTR).toBe("factory-dark");
    expect(tokens.background).toBe(FACTORY_DARK_FOUNDATION.background);
    expect(tokens.primary).toBe(FACTORY_DARK_FOUNDATION.accent);
    expect(tokens.secondary).toBe(FACTORY_DARK_FOUNDATION.secondaryAccent);
    expect(tokens.foreground).toBe(FACTORY_DARK_FOUNDATION.ink);
    expect(tokens.background.toLowerCase()).toBe("#050b10");
    expect(tokens.primary.toLowerCase()).toBe("#f5c76f");
    expect(tokens.secondary.toLowerCase()).toBe("#507f8c");
  });

  test("code-heavy guide route keeps inset text, persistent copy, secondary blue, and accessible copied status", async () => {
    expect(THEME_CODE_COPY_R00_ROUTE).toBe("/docs/guides/getting-started");
    expect(DOCS_CODE_BLOCK_INSET_INLINE).toBe("1rem");
    expect(DOCS_CODE_COPY_CONTROL_ATTR).toBe("data-docs-code-copy");
    expect(DOCS_CODE_COPY_CONTROL_VALUE).toBe("control");
    expect(DOCS_CODE_COPY_STATUS_ATTR).toBe("data-docs-code-copy-status");
    expect(DOCS_CODE_COPY_CHROME_TOKENS.interactiveColor).toBe(
      "var(--secondary)",
    );
    expect(DOCS_CODE_COPY_CHROME_TOKENS.focusRing).toBe("var(--secondary)");
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).toBe(
      FACTORY_DARK_FOUNDATION.secondaryAccent,
    );
    expect(DOCS_CODE_COPY_CHROME_FACTORY_DARK.interactiveColor).not.toBe(
      FACTORY_DARK_FOUNDATION.accentInk,
    );

    const writeText = installClipboardMock();
    render(
      <DocsPre className="language-sh">{`you run --named @goal/blah`}</DocsPre>,
    );

    const figure = document.querySelector("figure.docs-code-block");
    expect(figure).toBeTruthy();
    const viewport = figure?.querySelector(
      '[data-rich-content-scroll="code"]',
    ) as HTMLElement | null;
    expect(viewport).toBeTruthy();
    expect(viewport?.style.paddingInline).toBe(DOCS_CODE_BLOCK_INSET_INLINE);

    const rail = figure?.querySelector('[data-docs-code-actions="rail"]');
    const control = figure?.querySelector(
      `[${DOCS_CODE_COPY_CONTROL_ATTR}="${DOCS_CODE_COPY_CONTROL_VALUE}"]`,
    );
    expect(rail).toBeTruthy();
    expect(control).toBeTruthy();
    expect(rail?.contains(control as Node)).toBe(true);
    expect(viewport?.contains(control as Node)).toBe(false);

    const button = screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });

    const copiedButton = screen.getByRole("button", {
      name: DOCS_CODE_COPY_COPIED_LABEL,
    });
    expect(copiedButton.getAttribute("data-checked")).toBe("true");
    expect(
      copiedButton.querySelector('[data-docs-code-copy-icon="check"]'),
    ).toBeTruthy();

    const liveRegion = document.querySelector(
      `[${DOCS_CODE_COPY_STATUS_ATTR}]`,
    );
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.textContent).toBe(DOCS_CODE_COPY_COPIED_LABEL);
  });
});
