import { afterEach, describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shell";
import { enMessages } from "../../src/localization/messages/en";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

afterEach(() => {
  mock.restore();
});

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
  test("renders header, generated docs navigation, and main content landmarks", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
          <p className="docs-shell__framing">{enMessages.docs.framingText}</p>
        </article>
      </DocsShell>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: enMessages.docs.shellTitle,
      }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.docs.framingText)).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(PROJECT_NAME),
    ).toBeTruthy();
    expect(screen.getByText("Guides")).toBeTruthy();
    expect(screen.getByText("Getting started")).toBeTruthy();
  });

  test("marks the active generated nav entry and links home and GitHub", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const siteNav = screen.getByRole("navigation", {
      name: enMessages.landing.primaryNavAriaLabel,
    });
    const homeLink = within(siteNav).getByRole("link", {
      name: enMessages.common.home,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: `${enMessages.common.githubCta} (opens in new tab)`,
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

  test("does not mark docs entry overview as active when viewing generated pages", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath={DOCS_ENTRY_ROUTE}
        navigation={generatedNavigation}
      >
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const docsNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(docsNav).getByRole("link", {
      name: "Getting started",
    });

    expect(gettingStartedLink.getAttribute("aria-current")).toBeNull();
  });
});
