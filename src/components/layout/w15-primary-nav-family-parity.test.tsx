import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import type { SharedProps } from "fumadocs-ui/components/dialog/search";
import type { ComponentType } from "react";
import { act } from "react";
import { DocsHeader } from "@/components/layout/docs-header";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { source } from "@/lib/source";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";
import "@/tests/a11y/mock-navigation";

/** Trimmed header primary nav: Blog / Docs / Guides / References. */
const CLI_PRIMARY_NAV_HREFS = [
  "/blog",
  "/browse",
  "/docs/guides",
  "/docs/references",
] as const;

const CLI_PRIMARY_NAV_LABELS = [
  "Blog",
  "Docs",
  "Guides",
  "References",
] as const;

function collectPrimaryNavItems(
  container: HTMLElement,
): Array<{ href: string; label: string }> {
  const nav = within(container).getByRole("navigation", { name: "Primary" });
  return within(nav)
    .getAllByRole("link")
    .map((link) => ({
      href: link.getAttribute("href") ?? "",
      label: link.textContent?.trim() ?? "",
    }));
}

describe("primary-nav chrome set and desktop/mobile parity", () => {
  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("getPrimaryNavItems keeps Blog, Docs, Guides, References in product order", async () => {
    const messages = await loadUiMessages();
    const items = getPrimaryNavItems(messages);

    expect(items.map((item) => item.href)).toEqual([...CLI_PRIMARY_NAV_HREFS]);
    expect(items.map((item) => item.label)).toEqual([
      ...CLI_PRIMARY_NAV_LABELS,
    ]);
    expect(items.some((item) => item.href === "/search")).toBe(false);
    expect(items.some((item) => item.href === "/")).toBe(false);
    expect(items.some((item) => item.href === "/docs/factories")).toBe(false);
    expect(items.some((item) => item.href === "/docs/workers")).toBe(false);
    expect(items.some((item) => item.href === "/docs/workstations")).toBe(
      false,
    );
    expect(items.some((item) => item.href === "/docs/glossary")).toBe(false);
  });

  test("desktop and mobile Primary landmarks expose matching chrome order, hrefs, and labels", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const expectedItems = getPrimaryNavItems(messages);

    await act(async () => {
      await renderWithAppProviders(
        <DocsHeader messages={messages} pageTree={source.pageTree} />,
        { SearchDialog },
      );
    });

    const header = document.querySelector("header");
    expect(header).toBeTruthy();

    // Desktop inline Primary (visible in jsdom; CSS visibility is not asserted here).
    const desktopItems = collectPrimaryNavItems(header as HTMLElement);
    expect(desktopItems).toEqual(expectedItems);

    const menuButton = screen.getByRole("button", { name: messages.nav.menu });
    fireEvent.click(menuButton);

    const panelId = menuButton.getAttribute("aria-controls");
    const panel = document.getElementById(panelId ?? "");
    expect(panel).toBeTruthy();

    const mobileItems = collectPrimaryNavItems(panel as HTMLElement);
    expect(mobileItems).toEqual(expectedItems);
    expect(mobileItems.map((item) => item.href)).toEqual(
      desktopItems.map((item) => item.href),
    );
    expect(mobileItems.map((item) => item.label)).toEqual(
      desktopItems.map((item) => item.label),
    );

    // Brand/logo owns Home; Search stays a header control only.
    expect(desktopItems.some((item) => item.href === "/")).toBe(false);
    expect(desktopItems.some((item) => item.href === "/docs/guides")).toBe(
      true,
    );
    expect(desktopItems.some((item) => item.href === "/browse")).toBe(true);
    expect(desktopItems.some((item) => item.href === "/docs/references")).toBe(
      true,
    );
    expect(desktopItems.some((item) => item.href === "/blog")).toBe(true);
    expect(desktopItems.some((item) => item.href === "/docs/glossary")).toBe(
      false,
    );
    expect(desktopItems.some((item) => item.href === "/search")).toBe(false);
  });
});
