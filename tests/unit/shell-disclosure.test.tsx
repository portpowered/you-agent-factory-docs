import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RESPONSIVE_BREAKPOINTS_PX } from "../../src/lib/responsive-tokens";
import {
  DOCS_NAV_DISCLOSURE_HIDE_LABEL,
  DOCS_NAV_DISCLOSURE_SHOW_LABEL,
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
} from "../../src/lib/shell";
import MockLink from "../helpers/mock-next-link";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
}

function mockMatchMediaForWidth(width: number) {
  window.matchMedia = (query: string) => {
    const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);

    let matches = false;

    if (maxWidthMatch) {
      matches = width <= Number(maxWidthMatch[1]);
    } else if (minWidthMatch) {
      matches = width >= Number(minWidthMatch[1]);
    }

    return {
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    } as MediaQueryList;
  };
}

afterEach(() => {
  mock.restore();
});

describe("useShellDisclosure", () => {
  test("keeps docs navigation visible on desktop without a disclosure trigger", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    render(<DocsShell />);

    expect(
      screen.queryByRole("button", { name: DOCS_NAV_DISCLOSURE_SHOW_LABEL }),
    ).toBeNull();
    expect(
      screen.getByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeTruthy();
  });

  test("collapses docs navigation on narrow viewports until opened", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    render(<DocsShell />);

    const toggle = screen.getByRole("button", {
      name: DOCS_NAV_DISCLOSURE_SHOW_LABEL,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toBe(DOCS_NAV_DISCLOSURE_HIDE_LABEL);

    const docsNav = screen.getByRole("navigation", { name: DOCS_NAV_HEADING });
    const overviewLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_OVERVIEW_LABEL,
    });
    expect(overviewLink).toBeTruthy();
  });

  test("returns focus to the trigger when Escape closes narrow-viewport disclosure", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax);

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    render(<DocsShell />);

    const toggle = screen.getByRole("button", {
      name: DOCS_NAV_DISCLOSURE_SHOW_LABEL,
    });
    fireEvent.click(toggle);
    expect(
      screen.getByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
