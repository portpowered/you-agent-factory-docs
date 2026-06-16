import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_VALUE_STATEMENT,
} from "../../src/lib/shell";
import { fetchHttp } from "../helpers/http";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { LandingShell } = await import(
  "../../src/components/landing/landing-shell"
);

describe("homepage shell rendering", () => {
  test("renders project identity, value statement, and primary CTAs", () => {
    render(<LandingShell />);

    expect(
      screen.getByRole("heading", { level: 1, name: PROJECT_NAME }),
    ).toBeTruthy();
    expect(screen.getByText(LANDING_VALUE_STATEMENT)).toBeTruthy();

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const docsLinks = within(primaryNav).getAllByRole("link", {
      name: DOCS_CTA_LABEL,
    });
    const githubLinks = within(primaryNav).getAllByRole("link", {
      name: `${GITHUB_CTA_LABEL} (opens in new tab)`,
    });

    expect(docsLinks[0]?.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubLinks[0]?.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubLinks[0]?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("exposes keyboard-reachable docs and GitHub CTAs in the hero", () => {
    render(<LandingShell />);

    const hero = screen.getByRole("main");
    const docsCta = within(hero).getByRole("link", { name: DOCS_CTA_LABEL });
    const githubCta = within(hero).getByRole("link", {
      name: GITHUB_CTA_LABEL,
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
