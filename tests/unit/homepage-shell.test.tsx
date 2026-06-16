import { describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shell";
import { enMessages } from "../../src/localization/messages/en";
import { fetchHttp } from "../helpers/http";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { LandingShell } = await import(
  "../../src/components/landing/landing-shell"
);

describe("homepage shell rendering", () => {
  test("renders project identity, value statement, and primary CTAs from messages", () => {
    renderWithLocalization(<LandingShell />);

    expect(
      screen.getByRole("heading", { level: 1, name: PROJECT_NAME }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.landing.valueStatement)).toBeTruthy();

    const primaryNav = screen.getByRole("navigation", {
      name: enMessages.landing.primaryNavAriaLabel,
    });
    const docsLinks = within(primaryNav).getAllByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubLinks = within(primaryNav).getAllByRole("link", {
      name: `${enMessages.common.githubCta} (opens in new tab)`,
    });

    expect(docsLinks[0]?.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubLinks[0]?.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubLinks[0]?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("exposes keyboard-reachable docs and GitHub CTAs in the hero", () => {
    renderWithLocalization(<LandingShell />);

    const hero = screen.getByRole("main");
    const docsCta = within(hero).getByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubCta = within(hero).getByRole("link", {
      name: enMessages.common.githubCta,
    });

    expect(docsCta.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubCta.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubCta.getAttribute("target")).toBe("_blank");
  });
});

describe("homepage GitHub CTA destination", () => {
  test("points to a publicly reachable GitHub destination", async () => {
    const response = await fetchHttp(GITHUB_REPO_URL, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).not.toBe(404);
  });
});
