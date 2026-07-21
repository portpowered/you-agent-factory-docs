import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen, within } from "@testing-library/react";
import { act } from "react";
import { HarnessSupportMatrix } from "@/content/docs/documentation/harness-support/HarnessSupportMatrix";
import { BrowseIndexPage } from "@/features/docs/components/BrowseIndexPage";
import { DocsPre } from "@/features/docs/components/DocsCodeBlock";
import { HomeArticle } from "@/features/home/home-article";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/features/layout/primary-nav";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { buildDocsBrowseSections } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import {
  CRITICAL_ROUTES,
  CRITICAL_VIEWPORTS,
  listCriticalOverflowMatrixCases,
} from "@/lib/verify/a11y-responsive-contract";
import { probePrimaryNavUsability } from "@/lib/verify/a11y-responsive-nav-probe";
import {
  collectResponsiveOverflowProbe,
  findIntentionalHorizontalScrollContainers,
} from "@/lib/verify/a11y-responsive-probes";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("responsive overflow matrix (always-on)", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("contract matrix covers all critical routes at four viewports", () => {
    const cases = listCriticalOverflowMatrixCases();
    expect(cases).toHaveLength(
      CRITICAL_ROUTES.length * CRITICAL_VIEWPORTS.length,
    );
    expect(CRITICAL_VIEWPORTS.map((viewport) => viewport.width)).toEqual([
      390, 768, 1024, 1440,
    ]);
  });

  test("home shell keeps primary nav usable via mobile drawer", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <HomeArticle
            messages={context.messages}
            siteConfig={youAgentFactorySiteConfig}
          />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const menuButton = screen.getByRole("button", {
      name: context.messages.nav.menu,
    });
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      menuButton.click();
    });
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");

    const probe = probePrimaryNavUsability(document, "drawer");
    expect(probe.hasMenuButton).toBe(true);
    expect(probe.menuButtonExpanded).toBe(true);
    expect(probe.hasPrimaryNavigation).toBe(true);
    expect(probe.primaryLinkCount).toBeGreaterThanOrEqual(3);

    const drawerNav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(drawerNav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
    }
  });

  test("browse shell exposes labeled primary destinations without pointer-only dead ends", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildDocsBrowseSections({
      pages,
      locale: defaultLocale,
      messages: context.messages,
    });

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <BrowseIndexPage messages={context.messages} sections={sections} />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const menuButton = screen.getByRole("button", {
      name: context.messages.nav.menu,
    });
    await act(async () => {
      menuButton.click();
    });

    const drawerNav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      expect(
        within(drawerNav).getByRole("link", { name: item.label }),
      ).toBeTruthy();
    }
  });

  test("intentional table and code scrollers do not imply page-level overflow", () => {
    document.body.innerHTML = `
      <main>
        <div data-harness-support-matrix="" class="overflow-x-auto"></div>
        <div data-rich-content-scroll="code" class="overflow-x-auto"></div>
      </main>
    `;
    const matrix = document.querySelector(
      "[data-harness-support-matrix]",
    ) as HTMLElement;
    const code = document.querySelector(
      '[data-rich-content-scroll="code"]',
    ) as HTMLElement;
    for (const element of [matrix, code]) {
      Object.defineProperty(element, "clientWidth", {
        configurable: true,
        get: () => 200,
      });
      Object.defineProperty(element, "scrollWidth", {
        configurable: true,
        get: () => 700,
      });
    }
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });

    const probe = collectResponsiveOverflowProbe(document, document);
    expect(probe.page.hasUnintendedOverflow).toBe(false);
    expect(probe.allowsIntentionalScrollers).toBe(true);
    expect(
      findIntentionalHorizontalScrollContainers(document).filter(
        (hit) => hit.canScrollHorizontally,
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("harness matrix and fenced code markers remain intentional scroll containers", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <main>
            <HarnessSupportMatrix />
            <DocsPre className="language-sh">
              {`curl -fsSL https://example.invalid/very-long-install-script-path-that-should-scroll-horizontally-inside-its-viewport | sh`}
            </DocsPre>
          </main>
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const matrix = document.querySelector("[data-harness-support-matrix]");
    const code = document.querySelector('[data-rich-content-scroll="code"]');
    expect(matrix).toBeTruthy();
    expect(code).toBeTruthy();
    expect(matrix?.className).toContain("overflow-x-auto");
  });
});
