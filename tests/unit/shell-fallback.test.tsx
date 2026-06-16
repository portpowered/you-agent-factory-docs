import { describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE } from "../../src/lib/project";
import { enMessages } from "../../src/localization/messages/en";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

const frPrimaryNavAriaLabel = "Principale";
const frGetStarted = "Commencer";
const frHome = "Accueil";
const frDocsNavHeading = "Navigation de la documentation";
const frSiteNavAriaLabel = "Site";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { LandingShell } = await import(
  "../../src/components/landing/landing-shell"
);
const { DocsShell } = await import("../../src/components/docs/docs-shell");

describe("homepage shell fallback messaging", () => {
  test("renders localized labels and falls back to default locale for missing keys", () => {
    renderWithLocalization(<LandingShell />, { locale: "fr" });

    const primaryNav = screen.getByRole("navigation", {
      name: frPrimaryNavAriaLabel,
    });

    expect(
      within(primaryNav).getAllByRole("link", {
        name: frGetStarted,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      within(primaryNav).getAllByRole("link", {
        name: enMessages.common.githubCta,
      }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(enMessages.landing.valueStatement)).toBeTruthy();
  });

  test("keeps canonical route identities when rendering fallback shell text", () => {
    renderWithLocalization(<LandingShell />, { locale: "fr" });

    const docsLinks = screen.getAllByRole("link", {
      name: frGetStarted,
    });

    for (const link of docsLinks) {
      expect(link.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    }
  });
});

describe("docs shell fallback messaging", () => {
  test("renders localized labels and falls back to default locale for missing keys", () => {
    renderWithLocalization(<DocsShell />, { locale: "fr" });

    expect(
      screen.getByRole("navigation", {
        name: frDocsNavHeading,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", {
        name: frSiteNavAriaLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: enMessages.docs.shellTitle,
      }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.docs.framingText)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: enMessages.docs.navOverview }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: enMessages.common.githubCta }),
    ).toBeTruthy();
  });

  test("keeps canonical route identities when rendering fallback shell text", () => {
    renderWithLocalization(<DocsShell />, { locale: "fr" });

    const homeLink = screen.getByRole("link", { name: frHome });
    const overviewLink = screen.getByRole("link", {
      name: enMessages.docs.navOverview,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(overviewLink.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
  });
});
