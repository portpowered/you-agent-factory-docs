import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE } from "../../src/lib/project";
import {
  DOCS_NAV_HEADING,
  sharedShellConfig,
} from "../../src/lib/shared-shell-config";
import {
  SHARED_SHELL_CANONICAL_EXTENSION_POINTS,
  SHARED_SHELL_PROJECTED_EXTENSION_POINTS,
  createSharedShellConfig,
} from "../../src/lib/shared-shell-extension-points";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { SharedShell } = await import("../../src/components/shell/shared-shell");

describe("shared shell extension points", () => {
  test("documents canonical config versus projected shell behavior", () => {
    expect(
      SHARED_SHELL_CANONICAL_EXTENSION_POINTS.docsNavigationGroups,
    ).toContain("Docs sidebar");
    expect(SHARED_SHELL_PROJECTED_EXTENSION_POINTS.children).toContain(
      "surface wrappers",
    );
    expect(
      SHARED_SHELL_PROJECTED_EXTENSION_POINTS.navigationDisclosure,
    ).toContain("useShellDisclosure");
  });

  test("extends localized labels and additional docs navigation groups through createSharedShellConfig", () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const localizedBrand = "Localized Factory";
    const guidesHeading = "Guides";
    const extendedConfig = createSharedShellConfig({
      brand: localizedBrand,
      docsNavigationGroups: [
        ...sharedShellConfig.docsNavigationGroups,
        {
          heading: guidesHeading,
          items: [
            {
              id: "getting-started",
              label: "Getting started",
              href: `${DOCS_ENTRY_ROUTE}getting-started/`,
            },
          ],
        },
      ],
    });

    render(
      <SharedShell config={extendedConfig} surface="docs">
        <p>Extended docs content</p>
      </SharedShell>,
    );

    expect(
      within(screen.getByRole("banner")).getByText(localizedBrand),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: guidesHeading }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("navigation", { name: guidesHeading })).getByRole(
        "link",
        { name: "Getting started" },
      ),
    ).toBeTruthy();
    expect(screen.getByText("Extended docs content")).toBeTruthy();
  });

  test("keeps projected page content and disclosure state outside canonical config", () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    render(
      <SharedShell surface="home">
        <p>Projected homepage section</p>
      </SharedShell>,
    );

    expect(sharedShellConfig.brand).not.toBe("Projected homepage section");
    expect(screen.getByText("Projected homepage section")).toBeTruthy();
    expect(
      screen
        .getByRole("button", {
          name: sharedShellConfig.responsive.navigationDisclosure.openLabel,
        })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  test("uses the shared shell config path instead of bootstrap-only shell wiring", () => {
    expect(sharedShellConfig.docsNavigationGroups.length).toBeGreaterThan(0);
    expect(sharedShellConfig.primaryNavigation.destinations.length).toBe(3);
    expect(createSharedShellConfig({ brand: "Lane override" }).brand).toBe(
      "Lane override",
    );
  });
});
