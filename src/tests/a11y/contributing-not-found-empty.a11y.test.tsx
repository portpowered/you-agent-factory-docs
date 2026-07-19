/**
 * Always-on a11y smokes for launch extras: contributing-to-these-docs,
 * docs not-found recovery, and factory empty-state surfaces.
 */
import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import DocsNotFound from "@/app/docs/not-found";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
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

const ATLAS_PRODUCT_COPY =
  /Model Atlas|Browse the Atlas|the atlas|coming soon/i;

describe("contributing, not-found, and empty-state accessibility", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("contributing-to-these-docs exposes landmarks, headings, keyboard chrome, and Atlas-free copy", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderDocsSlugPage([
      "documentation",
      "contributing-to-these-docs",
    ]);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: "Contributing to these docs",
    });
    expect(structure.headingLevels[0]).toBe(1);
    expect(structure.headingLevels).toContain(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "What It Covers" }),
    ).toBeTruthy();

    const h1 = screen.getByRole("heading", {
      level: 1,
      name: "Contributing to these docs",
    });
    expect(h1.textContent).not.toMatch(ATLAS_PRODUCT_COPY);
    const lead = screen.getByText(/How to add factory documentation pages/i);
    expect(lead.textContent).toMatch(/you-agent-factory/i);
    expect(lead.textContent).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(document.body.textContent).toMatch(/not Model Atlas/i);
    expect(document.body.textContent).not.toMatch(
      /coming soon|Browse the Atlas/i,
    );

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    gettingStarted.focus();
    expect(document.activeElement).toBe(gettingStarted);

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("docs not-found exposes recovery links with keyboard focus and Atlas-free copy", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <DocsNotFound />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: "Page not found",
    });
    expect(structure.hasMain).toBe(true);

    const recovery = screen.getByRole("navigation", {
      name: "Recovery links",
    });
    const gettingStarted = within(recovery).getByRole("link", {
      name: "Getting Started",
    });
    const browse = within(recovery).getByRole("link", { name: "Browse" });
    const search = within(recovery).getByRole("link", { name: "Search" });
    const blog = within(recovery).getByRole("link", { name: "Blog" });

    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(browse.getAttribute("href")).toBe("/browse");
    expect(search.getAttribute("href")).toBe("/search");
    expect(blog.getAttribute("href")).toBe("/blog");

    for (const link of [gettingStarted, browse, search, blog]) {
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    expect(document.body.textContent).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(document.body.innerHTML).not.toMatch(
      /\/docs\/(models|modules|papers|training|systems)/i,
    );

    await expectNoSeriousAxeViolations(document.body);
  });

  test("section collection empty state exposes factory recovery affordances with keyboard focus and Atlas-free copy", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    // Glossary collection has no published entries; after #157 its messageKeys
    // reuse concepts index copy so hollow glossary advertising keys stay out
    // of common.json while empty-state chrome can still be exercised.
    const page = await renderSectionCollectionIndexPage("glossary");

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: context.messages.conceptsIndex.title,
    });
    expect(structure.headingLevels).toContain(2);

    const empty = screen.getByRole("status");
    expect(empty.textContent).toContain(
      context.messages.conceptsIndex.emptyTitle,
    );
    expect(empty.textContent).not.toMatch(ATLAS_PRODUCT_COPY);

    const home = within(empty).getByRole("link", {
      name: context.messages.conceptsIndex.emptyHomeLink,
    });
    const browse = within(empty).getByRole("link", {
      name: context.messages.browseIndex.title,
    });
    const blog = within(empty).getByRole("link", {
      name: context.messages.nav.blog,
    });
    const search = within(empty).getByRole("button", {
      name: context.messages.search.open,
    });

    expect(home.getAttribute("href")).toBe("/");
    expect(browse.getAttribute("href")).toBe("/browse");
    expect(blog.getAttribute("href")).toBe("/blog");

    for (const control of [home, browse, blog, search]) {
      control.focus();
      expect(document.activeElement).toBe(control);
      expect(control.className).toContain("focus-visible:ring");
    }

    await expectNoSeriousAxeViolations(document.body);
  });
});
