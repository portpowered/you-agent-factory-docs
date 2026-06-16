import { enMessages } from "@/localization/messages/en";

/** Reviewer-visible scope for the early gate accessibility lane. */
export const FOCUSED_SHELL_ACCESSIBILITY_COVERAGE = [
  "landing shell exposes a labeled Primary navigation landmark",
  "landing shell exposes a main landmark with an h1 hero title",
  "landing shell external GitHub CTA uses rel=noopener noreferrer",
  "docs shell exposes banner, labeled primary nav, labeled docs nav, and main landmarks",
  "docs shell marks the overview entry with aria-current=page",
] as const;

export type FocusedShellAccessibilityExpectation =
  (typeof FOCUSED_SHELL_ACCESSIBILITY_COVERAGE)[number];

export const LANDING_PRIMARY_NAV_ARIA_LABEL =
  enMessages.landing.primaryNavAriaLabel;
export const DOCS_SITE_NAV_ARIA_LABEL = enMessages.landing.primaryNavAriaLabel;
export const DOCS_OVERVIEW_ARIA_CURRENT = "page";

export type LandingShellAccessibilitySnapshot = {
  primaryNavigationLabel: string;
  hasMainLandmark: boolean;
  heroHeadingLevel: number;
  externalGithubLinkRel: string | null;
};

export type DocsShellAccessibilitySnapshot = {
  hasBannerLandmark: boolean;
  siteNavigationLabel: string;
  docsNavigationLabel: string;
  hasMainLandmark: boolean;
  overviewLinkAriaCurrent: string | null;
};

export type ShellAccessibilitySnapshot = {
  landing: LandingShellAccessibilitySnapshot;
  docs: DocsShellAccessibilitySnapshot;
};

export type ShellAccessibilityIssue = {
  surface: "landing" | "docs";
  field: string;
  message: string;
};

export type ShellAccessibilityValidationResult = {
  valid: boolean;
  issues: ShellAccessibilityIssue[];
};

export function getExpectedDocsNavigationLabel(): string {
  return enMessages.docs.navHeading;
}

/** Validates focused shell accessibility expectations for the current foundations. */
export function validateShellAccessibilitySnapshot(
  snapshot: ShellAccessibilitySnapshot,
): ShellAccessibilityValidationResult {
  const issues: ShellAccessibilityIssue[] = [];

  if (
    snapshot.landing.primaryNavigationLabel !== LANDING_PRIMARY_NAV_ARIA_LABEL
  ) {
    issues.push({
      surface: "landing",
      field: "primaryNavigationLabel",
      message: `Primary navigation must use aria-label="${LANDING_PRIMARY_NAV_ARIA_LABEL}"`,
    });
  }

  if (!snapshot.landing.hasMainLandmark) {
    issues.push({
      surface: "landing",
      field: "hasMainLandmark",
      message: "Landing shell must expose a main landmark",
    });
  }

  if (snapshot.landing.heroHeadingLevel !== 1) {
    issues.push({
      surface: "landing",
      field: "heroHeadingLevel",
      message: "Landing hero title must be rendered as an h1",
    });
  }

  if (snapshot.landing.externalGithubLinkRel !== "noopener noreferrer") {
    issues.push({
      surface: "landing",
      field: "externalGithubLinkRel",
      message: 'External GitHub CTA must use rel="noopener noreferrer"',
    });
  }

  if (!snapshot.docs.hasBannerLandmark) {
    issues.push({
      surface: "docs",
      field: "hasBannerLandmark",
      message: "Docs shell must expose a banner landmark",
    });
  }

  if (snapshot.docs.siteNavigationLabel !== DOCS_SITE_NAV_ARIA_LABEL) {
    issues.push({
      surface: "docs",
      field: "siteNavigationLabel",
      message: `Site navigation must use aria-label="${DOCS_SITE_NAV_ARIA_LABEL}"`,
    });
  }

  const expectedDocsNavLabel = getExpectedDocsNavigationLabel();
  if (snapshot.docs.docsNavigationLabel !== expectedDocsNavLabel) {
    issues.push({
      surface: "docs",
      field: "docsNavigationLabel",
      message: `Docs navigation must use aria-label="${expectedDocsNavLabel}"`,
    });
  }

  if (!snapshot.docs.hasMainLandmark) {
    issues.push({
      surface: "docs",
      field: "hasMainLandmark",
      message: "Docs shell must expose a main landmark",
    });
  }

  if (snapshot.docs.overviewLinkAriaCurrent !== DOCS_OVERVIEW_ARIA_CURRENT) {
    issues.push({
      surface: "docs",
      field: "overviewLinkAriaCurrent",
      message: `Docs overview entry must use aria-current="${DOCS_OVERVIEW_ARIA_CURRENT}"`,
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when focused shell accessibility expectations are not met. */
export function assertValidShellAccessibilitySnapshot(
  snapshot: ShellAccessibilitySnapshot,
): void {
  const result = validateShellAccessibilitySnapshot(snapshot);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.surface}.${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Shell accessibility validation failed:\n${details}`);
}
