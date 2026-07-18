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

/** Stable relative W15 family order inside primary navigation. */
const W15_FAMILY_HREFS = [
  "/docs/references",
  "/docs/factories",
  "/docs/workers",
  "/docs/workstations",
] as const;

const W15_FAMILY_LABELS = [
  "References",
  "Factories",
  "Workers",
  "Workstations",
] as const;

function familySlice(
  items: Array<{ href: string; label: string }>,
): Array<{ href: string; label: string }> {
  return items.filter((item) =>
    (W15_FAMILY_HREFS as readonly string[]).includes(item.href),
  );
}

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

describe("W15 primary-nav family exact order and desktop/mobile parity", () => {
  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("getPrimaryNavItems keeps family destinations in exact relative order", async () => {
    const messages = await loadUiMessages();
    const familyItems = familySlice(getPrimaryNavItems(messages));

    expect(familyItems.map((item) => item.href)).toEqual([...W15_FAMILY_HREFS]);
    expect(familyItems.map((item) => item.label)).toEqual([
      ...W15_FAMILY_LABELS,
    ]);
    expect(
      getPrimaryNavItems(messages).some((item) => item.href === "/search"),
    ).toBe(false);
  });

  test("desktop and mobile Primary landmarks expose matching family order, hrefs, and labels", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const expectedFamily = familySlice(getPrimaryNavItems(messages));

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
    expect(familySlice(desktopItems)).toEqual(expectedFamily);

    const menuButton = screen.getByRole("button", { name: messages.nav.menu });
    fireEvent.click(menuButton);

    const panelId = menuButton.getAttribute("aria-controls");
    const panel = document.getElementById(panelId ?? "");
    expect(panel).toBeTruthy();

    const mobileItems = collectPrimaryNavItems(panel as HTMLElement);
    expect(familySlice(mobileItems)).toEqual(expectedFamily);
    expect(mobileItems.map((item) => item.href)).toEqual(
      desktopItems.map((item) => item.href),
    );
    expect(mobileItems.map((item) => item.label)).toEqual(
      desktopItems.map((item) => item.label),
    );

    // Existing non-family destinations remain; Search stays out of primary nav.
    expect(desktopItems.some((item) => item.href === "/")).toBe(true);
    expect(desktopItems.some((item) => item.href === "/docs/guides")).toBe(
      true,
    );
    expect(desktopItems.some((item) => item.href === "/browse")).toBe(true);
    expect(desktopItems.some((item) => item.href === "/docs/glossary")).toBe(
      true,
    );
    expect(desktopItems.some((item) => item.href === "/blog")).toBe(true);
    expect(desktopItems.some((item) => item.href === "/search")).toBe(false);
  });
});
