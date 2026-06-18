import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { enMessages } from "../../src/localization/messages/en";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

afterEach(() => {
  mock.restore();
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
