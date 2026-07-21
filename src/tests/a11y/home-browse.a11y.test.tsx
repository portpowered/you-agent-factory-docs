import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen, within } from "@testing-library/react";
import { act } from "react";
import { composeProductionLandingSlots } from "@/app/(site)/compose-production-landing-slots";
import { BrowseIndexPage } from "@/features/docs/components/BrowseIndexPage";
import { HomeArticle } from "@/features/home/home-article";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/features/layout/primary-nav";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { buildDocsBrowseSections } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import {
  expectCriticalPageStructure,
  listKeyboardFocusableControls,
} from "@/lib/verify/a11y-page-structure";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("home and browse accessibility", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("production landing home exposes landmarks, keyboard focus, and no serious axe violations", async () => {
    await act(async () => {
      await renderWithAppProviders(
        <LandingPage {...composeProductionLandingSlots()} />,
      );
    });

    expect(document.querySelector("[data-landing-page]")).toBeTruthy();
    expect(document.querySelector("main")).toBeTruthy();

    const structure = expectCriticalPageStructure(document, {
      expectedH1: fixtureLandingPageData.hero.title,
    });
    expect(structure.headingLevels[0]).toBe(1);

    const nav = screen.getByRole("navigation", { name: "Landing" });
    for (const item of fixtureLandingPageData.header.nav) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("HomeArticle under docs layout keeps landmarks and keyboard focus (component contract)", async () => {
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

    const structure = expectCriticalPageStructure(document, {
      expectedH1: context.messages.home.title,
    });
    expect(structure.headingLevels[0]).toBe(1);
    expect(
      structure.headingLevels.filter((level) => level === 2).length,
    ).toBeGreaterThan(0);

    const header = document.querySelector("header");
    expect(header).toBeTruthy();
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

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("browse exposes landmarks, coherent headings, keyboard focus, and no serious axe violations", async () => {
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
          <h1>{context.messages.browseIndex.title}</h1>
          <p>{context.messages.browseIndex.description}</p>
          <BrowseIndexPage messages={context.messages} sections={sections} />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: context.messages.browseIndex.title,
    });
    expect(structure.headingLevels).toContain(2);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: context.messages.browseIndex.quickRoutesTitle,
      }),
    ).toBeTruthy();
    for (const label of ["Guides", "Concepts", "Techniques", "Documentation"]) {
      expect(
        screen.getByRole("heading", { level: 2, name: label }),
      ).toBeTruthy();
    }

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
    }

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);
    expect(controls.some((control) => control.href === "/search")).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });
});
