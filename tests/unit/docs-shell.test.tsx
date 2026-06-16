import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "../../src/lib/shell";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { DocsShell } = await import("../../src/components/docs/docs-shell");

describe("docs shell rendering", () => {
  test("renders header, docs navigation, and main content landmarks", () => {
    render(<DocsShell />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE }),
    ).toBeTruthy();
    expect(screen.getByText(DOCS_SHELL_FRAMING_TEXT)).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(PROJECT_NAME),
    ).toBeTruthy();
  });

  test("marks the overview entry as current and links home and GitHub", () => {
    render(<DocsShell />);

    const siteNav = screen.getByRole("navigation", { name: "Primary" });
    const homeLink = within(siteNav).getByRole("link", {
      name: HOME_CTA_LABEL,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: GITHUB_CTA_LABEL,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(githubLink.getAttribute("href")).toBe(GITHUB_REPO_URL);

    const docsNav = screen.getByRole("navigation", { name: DOCS_NAV_HEADING });
    const overviewLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_OVERVIEW_LABEL,
    });

    expect(overviewLink.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(overviewLink.getAttribute("aria-current")).toBe("page");
  });
});
