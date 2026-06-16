import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
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

describe("docs shell rendering", () => {
  test("renders header, generated docs navigation, and main content landmarks", () => {
    render(
      <DocsShell navigation={generatedNavigation}>
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
          <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
        </article>
      </DocsShell>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE }),
    ).toBeTruthy();
    expect(screen.getByText(DOCS_SHELL_FRAMING_TEXT)).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(PROJECT_NAME),
    ).toBeTruthy();
    expect(screen.getByText("Guides")).toBeTruthy();
    expect(screen.getByText("Getting started")).toBeTruthy();
  });

  test("marks the active generated nav entry and links home and GitHub", () => {
    render(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const siteNav = screen.getByRole("navigation", { name: "Primary" });
    const homeLink = within(siteNav).getByRole("link", {
      name: HOME_CTA_LABEL,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: `${GITHUB_CTA_LABEL} (opens in new tab)`,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(githubLink.getAttribute("href")).toBe(GITHUB_REPO_URL);

    const docsNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(docsNav).getByRole("link", {
      name: "Getting started",
    });

    expect(gettingStartedLink.getAttribute("href")).toBe(
      "/docs/getting-started",
    );
    expect(gettingStartedLink.getAttribute("aria-current")).toBe("page");
  });

  test("does not mark docs entry overview as active when viewing generated pages", () => {
    render(
      <DocsShell
        currentPath={DOCS_ENTRY_ROUTE}
        navigation={generatedNavigation}
      >
        <h1>{DOCS_SHELL_TITLE}</h1>
      </DocsShell>,
    );

    const docsNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(docsNav).getByRole("link", {
      name: "Getting started",
    });

    expect(gettingStartedLink.getAttribute("aria-current")).toBeNull();
  });
});
