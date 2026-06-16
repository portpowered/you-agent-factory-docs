import { describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shell";
import { enMessages } from "../../src/localization/messages/en";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { DocsShell } = await import("../../src/components/docs/docs-shell");

describe("docs shell rendering", () => {
  test("renders header, docs navigation, and main content landmarks from messages", () => {
    renderWithLocalization(<DocsShell />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: enMessages.docs.navHeading }),
    ).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: enMessages.docs.shellTitle,
      }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.docs.framingText)).toBeTruthy();
    expect(screen.getByText(PROJECT_NAME)).toBeTruthy();
  });

  test("marks the overview entry as current and links home and GitHub", () => {
    renderWithLocalization(<DocsShell />);

    const siteNav = screen.getByRole("navigation", {
      name: enMessages.docs.siteNavAriaLabel,
    });
    const homeLink = within(siteNav).getByRole("link", {
      name: enMessages.common.home,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: enMessages.common.githubCta,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(githubLink.getAttribute("href")).toBe(GITHUB_REPO_URL);

    const docsNav = screen.getByRole("navigation", {
      name: enMessages.docs.navHeading,
    });
    const overviewLink = within(docsNav).getByRole("link", {
      name: enMessages.docs.navOverview,
    });

    expect(overviewLink.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(overviewLink.getAttribute("aria-current")).toBe("page");
  });
});
