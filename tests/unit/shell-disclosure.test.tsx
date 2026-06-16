import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { enMessages } from "../../src/localization/messages/en";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

const generatedNavigation: DocsShellNavigationInput = {
  sections: [
    {
      id: "guides",
      label: "Guides",
      pages: [
        {
          canonicalId: "doc/getting-started",
          label: "Getting started",
          href: "/docs/getting-started",
          order: 1,
        },
      ],
    },
  ],
};

afterEach(() => {
  mock.restore();
});

describe("useShellDisclosure", () => {
  test("keeps docs navigation visible on desktop without requiring disclosure", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();
  });

  test("collapses docs navigation on narrow viewports until opened", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.showDocsNavLabel,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Guides" })).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toBe(enMessages.shell.hideDocsNavLabel);

    const docsNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(docsNav).getByRole("link", {
      name: "Getting started",
    });
    expect(gettingStartedLink).toBeTruthy();
  });

  test("returns focus to the trigger when Escape closes narrow-viewport disclosure", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.showDocsNavLabel,
    });
    fireEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("navigation", { name: "Guides" })).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("preserves keyboard open, close, and focus return when reduced motion is preferred", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.mobileMax,
      prefersReducedMotion: true,
    });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    const { container } = renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const shellRoot = container.querySelector(".shared-shell");
    expect(shellRoot?.hasAttribute("data-shell-reduced-motion")).toBe(true);

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.showDocsNavLabel,
    });
    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("navigation", { name: "Guides" })).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("landing shell disclosure", () => {
  test("keeps header navigation visible on desktop without requiring disclosure", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );
    renderWithLocalization(<LandingShell />);

    expect(
      screen.getByRole("navigation", {
        name: enMessages.landing.primaryNavAriaLabel,
      }),
    ).toBeTruthy();
  });

  test("collapses landing header navigation on narrow viewports until opened", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );
    renderWithLocalization(<LandingShell />);

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.openMenuLabel,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("navigation", {
        name: enMessages.landing.primaryNavAriaLabel,
      }),
    ).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toBe(enMessages.shell.closeMenuLabel);
    expect(
      screen.getByRole("navigation", {
        name: enMessages.landing.primaryNavAriaLabel,
      }),
    ).toBeTruthy();
  });

  test("returns focus to the trigger when Escape closes landing disclosure", async () => {
    mock.module("next/link", () => ({
      default: MockLink,
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );
    renderWithLocalization(<LandingShell />);

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.openMenuLabel,
    });
    fireEvent.click(toggle);
    expect(
      screen.getByRole("navigation", {
        name: enMessages.landing.primaryNavAriaLabel,
      }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("navigation", {
        name: enMessages.landing.primaryNavAriaLabel,
      }),
    ).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
