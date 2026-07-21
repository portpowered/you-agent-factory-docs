import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import { HarnessSupportMatrix } from "@/content/docs/documentation/harness-support/HarnessSupportMatrix";
import { DocsPre } from "@/features/docs/components/DocsCodeBlock";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/features/layout/primary-nav";
import {
  expectCriticalPageStructure,
  listKeyboardFocusableControls,
} from "@/lib/verify/a11y-page-structure";
import { findIntentionalHorizontalScrollContainers } from "@/lib/verify/a11y-responsive-probes";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("docs and harness-support accessibility", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("getting-started docs article exposes landmarks, headings, keyboard chrome, and no serious axe violations", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderDocsSlugPage(["guides", "getting-started"]);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: "Getting Started",
    });
    expect(structure.headingLevels[0]).toBe(1);
    expect(structure.headingLevels).toContain(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "What It Is" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Install" }),
    ).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    const searchButton = screen.getByRole("button", {
      name: context.messages.search.open,
    });
    searchButton.focus();
    expect(document.activeElement).toBe(searchButton);

    const sidebar = document.getElementById("nd-sidebar");
    expect(sidebar).toBeTruthy();
    expect(sidebar?.getAttribute("aria-label")).toBe(
      context.messages.shell.sidebarTitle,
    );

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    const codeBlocks = document.querySelectorAll(
      "pre, [data-rich-content-scroll='code']",
    );
    expect(codeBlocks.length).toBeGreaterThan(0);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("harness-support exposes landmarks, labeled matrix, intentional scroll wrapper, and no serious axe violations", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderDocsSlugPage(["documentation", "harness-support"]);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: "Harness Support",
    });
    expect(structure.headingLevels).toContain(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "Support Matrix" }),
    ).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
    }

    const matrixWrapper = screen.getByTestId("harness-support-matrix");
    expect(matrixWrapper.className).toContain("overflow-x-auto");
    expect(matrixWrapper.getAttribute("data-harness-support-matrix")).toBe("");
    expect(matrixWrapper.tagName.toLowerCase()).toBe("div");
    expect(
      within(matrixWrapper).getByRole("table", {
        name: "Harness support matrix",
      }),
    ).toBeTruthy();

    const intentional = findIntentionalHorizontalScrollContainers(document);
    expect(
      intentional.some(
        (hit) => hit.matchedBy === "[data-harness-support-matrix]",
      ),
    ).toBe(true);

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("wide matrix and fenced code wrappers register as intentional horizontal scroll containers", () => {
    render(
      <main>
        <HarnessSupportMatrix />
        <DocsPre className="language-sh">
          {`curl -fsSL https://example.invalid/very-long-install-script-path-that-should-scroll-horizontally-inside-its-viewport | sh`}
        </DocsPre>
      </main>,
    );

    const matrix = screen.getByTestId("harness-support-matrix");
    const codeViewport = document.querySelector(
      '[data-rich-content-scroll="code"]',
    ) as HTMLElement | null;
    expect(matrix).toBeTruthy();
    expect(codeViewport).toBeTruthy();

    Object.defineProperty(matrix, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(matrix, "scrollWidth", {
      configurable: true,
      get: () => 900,
    });
    Object.defineProperty(codeViewport as HTMLElement, "clientWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(codeViewport as HTMLElement, "scrollWidth", {
      configurable: true,
      get: () => 720,
    });

    const hits = findIntentionalHorizontalScrollContainers(document);
    expect(
      hits.find((hit) => hit.matchedBy === "[data-harness-support-matrix]")
        ?.canScrollHorizontally,
    ).toBe(true);
    expect(
      hits.find((hit) => hit.matchedBy === '[data-rich-content-scroll="code"]')
        ?.canScrollHorizontally,
    ).toBe(true);
  });
});
