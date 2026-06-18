import { describe, expect, mock, test } from "bun:test";
import { screen } from "@testing-library/react";
import {
  FOCUSED_SHELL_ACCESSIBILITY_COVERAGE,
  LANDING_PRIMARY_NAV_ARIA_LABEL,
  assertValidShellAccessibilitySnapshot,
  getExpectedDocsNavigationLabel,
  validateShellAccessibilitySnapshot,
} from "../../src/lib/validation/shell-accessibility";
import { enMessages } from "../../src/localization/messages/en";
import { MockFumadocsDocsLayout } from "../helpers/mock-fumadocs-docs-layout";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";
import {
  collectDocsShellAccessibilitySnapshot,
  collectLandingShellAccessibilitySnapshot,
} from "../helpers/shell-accessibility";

mock.module("next/link", () => ({
  default: MockLink,
}));
mock.module("fumadocs-ui/layouts/docs", () => ({
  DocsLayout: MockFumadocsDocsLayout,
}));

const { LandingShell } = await import(
  "../../src/components/landing/landing-shell"
);
const { FumadocsDocsLayout } = await import(
  "../../src/components/docs/fumadocs-docs-layout"
);
const DocsPage = (await import("../../src/app/docs/page")).default;

describe("shell accessibility validation", () => {
  test("accepts the current landing and docs shell accessibility snapshots", () => {
    const landingRendered = renderWithLocalization(<LandingShell />);
    const landingSnapshot =
      collectLandingShellAccessibilitySnapshot(landingRendered);
    const docsRendered = renderWithLocalization(
      <FumadocsDocsLayout>
        <DocsPage />
      </FumadocsDocsLayout>,
    );
    const docsSnapshot = collectDocsShellAccessibilitySnapshot(docsRendered);

    expect(
      validateShellAccessibilitySnapshot({
        landing: landingSnapshot,
        docs: docsSnapshot,
      }).valid,
    ).toBe(true);
    expect(() =>
      assertValidShellAccessibilitySnapshot({
        landing: landingSnapshot,
        docs: docsSnapshot,
      }),
    ).not.toThrow();
  });

  test("rejects a missing primary navigation label regression", () => {
    const result = validateShellAccessibilitySnapshot({
      landing: {
        primaryNavigationLabel: "",
        hasMainLandmark: true,
        heroHeadingLevel: 1,
        externalGithubLinkRel: "noopener noreferrer",
      },
      docs: {
        hasBannerLandmark: true,
        docsNavigationLabel: getExpectedDocsNavigationLabel(),
        hasMainLandmark: true,
        hasSearchRegion: true,
        hasBreadcrumbNavigation: true,
        hasProgressionNavigation: true,
        docsRootLabel: enMessages.docs.shellTitle,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: "landing",
          field: "primaryNavigationLabel",
        }),
      ]),
    );
  });

  test("landing shell uses the shared primary navigation aria label constant", () => {
    const rendered = renderWithLocalization(<LandingShell />);

    expect(
      collectLandingShellAccessibilitySnapshot(rendered).primaryNavigationLabel,
    ).toBe(LANDING_PRIMARY_NAV_ARIA_LABEL);
    expect(
      screen.getByRole("navigation", {
        name: LANDING_PRIMARY_NAV_ARIA_LABEL,
      }),
    ).toBeTruthy();
  });

  test("documents bounded early-gate accessibility coverage through rendered landmarks", () => {
    renderWithLocalization(<LandingShell />);
    renderWithLocalization(
      <FumadocsDocsLayout>
        <DocsPage />
      </FumadocsDocsLayout>,
    );

    for (const expectation of FOCUSED_SHELL_ACCESSIBILITY_COVERAGE) {
      expect(expectation.length).toBeGreaterThan(0);
    }

    expect(
      screen.getAllByRole("navigation", {
        name: getExpectedDocsNavigationLabel(),
      }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("main").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("banner").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("region", { name: enMessages.docs.searchTitle })
        .length,
    ).toBeGreaterThan(0);
  });
});
