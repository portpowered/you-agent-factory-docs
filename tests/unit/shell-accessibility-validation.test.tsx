import { describe, expect, mock, test } from "bun:test";
import { screen } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { DOCS_ENTRY_ROUTE } from "../../src/lib/project";
import {
  DOCS_SITE_NAV_ARIA_LABEL,
  FOCUSED_SHELL_ACCESSIBILITY_COVERAGE,
  LANDING_PRIMARY_NAV_ARIA_LABEL,
  assertValidShellAccessibilitySnapshot,
  getExpectedDocsNavigationLabel,
  validateShellAccessibilitySnapshot,
} from "../../src/lib/validation/shell-accessibility";
import { enMessages } from "../../src/localization/messages/en";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";
import {
  collectDocsShellAccessibilitySnapshot,
  collectLandingShellAccessibilitySnapshot,
} from "../helpers/shell-accessibility";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { LandingShell } = await import(
  "../../src/components/landing/landing-shell"
);
const { DocsShell } = await import("../../src/components/docs/docs-shell");

const overviewNavigation: DocsShellNavigationInput = {
  sections: [
    {
      id: "overview",
      label: "",
      pages: [
        {
          canonicalId: "overview",
          label: enMessages.docs.navOverview,
          href: DOCS_ENTRY_ROUTE,
          order: 1,
        },
      ],
    },
  ],
};

describe("shell accessibility validation", () => {
  test("accepts the current landing and docs shell accessibility snapshots", () => {
    const landingRendered = renderWithLocalization(<LandingShell />);
    const landingSnapshot =
      collectLandingShellAccessibilitySnapshot(landingRendered);
    const docsRendered = renderWithLocalization(
      <DocsShell navigation={overviewNavigation} currentPath={DOCS_ENTRY_ROUTE}>
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
        </article>
      </DocsShell>,
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
        siteNavigationLabel: DOCS_SITE_NAV_ARIA_LABEL,
        docsNavigationLabel: getExpectedDocsNavigationLabel(),
        hasMainLandmark: true,
        overviewLinkAriaCurrent: "page",
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
      <DocsShell navigation={overviewNavigation} currentPath={DOCS_ENTRY_ROUTE}>
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
        </article>
      </DocsShell>,
    );

    for (const expectation of FOCUSED_SHELL_ACCESSIBILITY_COVERAGE) {
      expect(expectation.length).toBeGreaterThan(0);
    }

    expect(
      screen.getAllByRole("navigation", {
        name: LANDING_PRIMARY_NAV_ARIA_LABEL,
      }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("main").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("banner").length).toBeGreaterThan(0);
  });
});
