import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE } from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
  sharedShellConfig,
} from "../../src/lib/shared-shell-config";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { SharedShellNavigationLink, SharedShellPrimaryNavigation } =
  await import("../../src/components/shell/shared-shell-navigation");

const { SharedShell } = await import("../../src/components/shell/shared-shell");

describe("shared shell navigation primitives", () => {
  test("renders internal links with accessible names and current-location treatment", () => {
    render(
      <SharedShellNavigationLink
        destination={{
          id: "docs",
          label: DOCS_CTA_LABEL,
          href: DOCS_ENTRY_ROUTE,
        }}
        isCurrent
      />,
    );

    const link = screen.getByRole("link", { name: DOCS_CTA_LABEL });

    expect(link.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toContain("shared-shell__link");
  });

  test("renders external GitHub links with accessible names and new-tab semantics", () => {
    render(
      <SharedShellNavigationLink
        destination={{
          id: "github",
          label: GITHUB_CTA_LABEL,
          href: GITHUB_REPO_URL,
          external: true,
        }}
      />,
    );

    const link = screen.getByRole("link", {
      name: `${GITHUB_CTA_LABEL} (opens in new tab)`,
    });

    expect(link.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.className).toContain("shared-shell__link--external");
  });

  test("keeps primary navigation links keyboard reachable in configured order", () => {
    render(
      <SharedShellPrimaryNavigation
        ariaLabel="Primary"
        destinations={[
          {
            id: "docs",
            label: DOCS_CTA_LABEL,
            href: DOCS_ENTRY_ROUTE,
          },
          {
            id: "github",
            label: GITHUB_CTA_LABEL,
            href: GITHUB_REPO_URL,
            external: true,
          },
        ]}
      />,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(primaryNav).getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links.map((link) => link.textContent)).toEqual([
      DOCS_CTA_LABEL,
      GITHUB_CTA_LABEL,
    ]);

    for (const link of links) {
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.getAttribute("tabindex")).not.toBe("-1");
    }
  });
});

describe("shared shell primary navigation contract", () => {
  test("consumes the same destination contract on homepage and docs surfaces", () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { rerender } = render(
      <SharedShell surface="home">
        <p>Home</p>
      </SharedShell>,
    );

    const homePrimaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(homePrimaryNav).getByRole("link", { name: DOCS_CTA_LABEL }),
    ).toBeTruthy();
    expect(
      within(homePrimaryNav).getByRole("link", {
        name: `${GITHUB_CTA_LABEL} (opens in new tab)`,
      }),
    ).toBeTruthy();

    rerender(
      <SharedShell surface="docs">
        <p>Docs</p>
      </SharedShell>,
    );

    const docsPrimaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(docsPrimaryNav).getByRole("link", { name: HOME_CTA_LABEL }),
    ).toBeTruthy();
    expect(
      within(docsPrimaryNav).getByRole("link", {
        name: `${GITHUB_CTA_LABEL} (opens in new tab)`,
      }),
    ).toBeTruthy();
    expect(
      within(docsPrimaryNav).queryByRole("link", { name: DOCS_CTA_LABEL }),
    ).toBeNull();
  });

  test("derives labels and destinations from sharedShellConfig without page-local duplication", () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    render(
      <SharedShell surface="home">
        <p>Home</p>
      </SharedShell>,
    );

    const configuredIds =
      sharedShellConfig.headerDestinationIdsBySurface.home.join(",");
    const configuredLabels =
      sharedShellConfig.headerDestinationIdsBySurface.home
        .map(
          (destinationId) =>
            sharedShellConfig.primaryNavigation.destinations.find(
              (destination) => destination.id === destinationId,
            )?.label,
        )
        .join(",");

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const renderedLabels = within(primaryNav)
      .getAllByRole("link")
      .map((link) => link.textContent)
      .join(",");

    expect(configuredIds).toBe("docs,github");
    expect(configuredLabels).toBe(`${DOCS_CTA_LABEL},${GITHUB_CTA_LABEL}`);
    expect(renderedLabels).toBe(configuredLabels);
  });
});
