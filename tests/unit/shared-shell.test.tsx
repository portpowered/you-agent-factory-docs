import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
  sharedShellConfig,
} from "../../src/lib/shared-shell-config";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { SharedShell, isDocsEntryRoute } = await import(
  "../../src/components/shell/shared-shell"
);

describe("shared shell structure", () => {
  test("renders the same header, main, and footer frame for homepage and docs surfaces", () => {
    const { rerender } = render(
      <SharedShell surface="home">
        <p>Home content</p>
      </SharedShell>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(screen.getByText("Home content")).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(sharedShellConfig.brand),
    ).toBeTruthy();

    rerender(
      <SharedShell surface="docs">
        <p>Docs content</p>
      </SharedShell>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(screen.getByText("Docs content")).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(sharedShellConfig.brand),
    ).toBeTruthy();
  });

  test("keeps canonical shell configuration separate from projected page content", () => {
    render(
      <SharedShell surface="home">
        <p>Projected page section</p>
      </SharedShell>,
    );

    expect(sharedShellConfig.brand).toBe(PROJECT_NAME);
    expect(sharedShellConfig.primaryNavigation.destinations).toHaveLength(3);
    expect(screen.getByText("Projected page section")).toBeTruthy();
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        sharedShellConfig.structural.footerText ?? "",
      ),
    ).toBeTruthy();
  });

  test("projects docs sidebar navigation from sharedShellConfig on the docs surface", () => {
    render(
      <SharedShell surface="docs">
        <p>Docs article</p>
      </SharedShell>,
    );

    const docsNav = screen.getByRole("navigation", {
      name: sharedShellConfig.docsNavigationGroups[0]?.heading,
    });

    expect(
      within(docsNav).getByRole("link", { name: "Overview" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("navigation", { name: "Docs navigation" }),
    ).toBeTruthy();
  });

  test("uses surface-specific header destinations from sharedShellConfig", () => {
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
    expect(
      within(homePrimaryNav).queryByRole("link", { name: HOME_CTA_LABEL }),
    ).toBeNull();

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
      docsPrimaryNav.querySelector(`a[href="${GITHUB_REPO_URL}"]`),
    ).toBeTruthy();
    expect(
      within(docsPrimaryNav).queryByRole("link", { name: DOCS_CTA_LABEL }),
    ).toBeNull();
  });
});

describe("shared shell docs entry route helper", () => {
  test("recognizes the docs entry route with or without a trailing slash", () => {
    expect(isDocsEntryRoute(DOCS_ENTRY_ROUTE)).toBe(true);
    expect(isDocsEntryRoute(`${DOCS_ENTRY_ROUTE}/`)).toBe(true);
    expect(isDocsEntryRoute("/")).toBe(false);
  });
});
