import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import {
  DOCS_SITE_NAV_ARIA_LABEL,
  FOCUSED_SHELL_ACCESSIBILITY_COVERAGE,
  LANDING_PRIMARY_NAV_ARIA_LABEL,
  assertValidShellAccessibilitySnapshot,
  getExpectedDocsNavigationLabel,
  validateShellAccessibilitySnapshot,
} from "../../src/lib/validation/shell-accessibility";
import MockLink from "../helpers/mock-next-link";
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

describe("shell accessibility validation", () => {
  test("documents the bounded early-gate accessibility coverage", () => {
    expect(FOCUSED_SHELL_ACCESSIBILITY_COVERAGE.length).toBeGreaterThan(0);
    expect(FOCUSED_SHELL_ACCESSIBILITY_COVERAGE).toContain(
      "landing shell exposes a labeled Primary navigation landmark",
    );
  });

  test("accepts the current landing and docs shell accessibility snapshots", () => {
    const landingRendered = render(<LandingShell />);
    const landingSnapshot =
      collectLandingShellAccessibilitySnapshot(landingRendered);
    const docsRendered = render(<DocsShell />);
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
    const rendered = render(<LandingShell />);

    expect(
      collectLandingShellAccessibilitySnapshot(rendered).primaryNavigationLabel,
    ).toBe(LANDING_PRIMARY_NAV_ARIA_LABEL);
  });
});
