import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { act } from "react";
import { BrowseIndexPage } from "@/features/docs/components/BrowseIndexPage";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { buildDocsBrowseSections } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import {
  MOBILE_DRAWER_MOTION_CHROME,
  REDUCED_MOTION_CHROME_SELECTOR,
} from "@/lib/verify/a11y-reduced-motion";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("prefers-reduced-motion (always-on)", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("mobile drawer chrome is marked and carries motion-reduce classes", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildDocsBrowseSections({
      pages,
      locale: defaultLocale,
      messages: context.messages,
    });

    // Docs chrome drawer lives on CanonicalDocsLayout surfaces (browse), not
    // production `/` LandingPage.
    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <h1>{context.messages.browseIndex.title}</h1>
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

    const drawer = document.querySelector(
      `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`,
    );
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute("role")).toBe("dialog");

    const className = drawer?.className ?? "";
    expect(className).toContain("duration-300");
    expect(className).toContain("motion-reduce:transition-none");
    expect(className).toContain("motion-reduce:duration-0");

    const backdrop = document.querySelector(
      '[data-motion-chrome="mobile-drawer-backdrop"]',
    );
    expect(backdrop).not.toBeNull();
    expect(backdrop?.className ?? "").toContain(
      "motion-reduce:transition-none",
    );

    expect(document.querySelector(REDUCED_MOTION_CHROME_SELECTOR)).toBe(drawer);
  });
});
