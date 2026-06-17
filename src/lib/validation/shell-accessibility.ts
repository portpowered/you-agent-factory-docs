import { enMessages } from "@/localization/messages/en";

/** Reviewer-visible scope for the early gate accessibility lane. */
export const FOCUSED_SHELL_ACCESSIBILITY_COVERAGE = [
  "landing shell exposes a labeled Primary navigation landmark",
  "landing shell exposes a main landmark with an h1 hero title",
  "landing shell external GitHub CTA uses rel=noopener noreferrer",
  "docs route exposes banner, labeled docs nav, search, breadcrumb, progression, and main landmarks through the Fumadocs path",
  "docs route keeps the canonical docs-root context visible on the /docs entry path",
] as const;

export type FocusedShellAccessibilityExpectation =
  (typeof FOCUSED_SHELL_ACCESSIBILITY_COVERAGE)[number];

export const LANDING_PRIMARY_NAV_ARIA_LABEL =
  enMessages.landing.primaryNavAriaLabel;
export const DOCS_ROOT_LABEL = enMessages.docs.shellTitle;

export type LandingShellAccessibilitySnapshot = {
  primaryNavigationLabel: string;
  hasMainLandmark: boolean;
  heroHeadingLevel: number;
  externalGithubLinkRel: string | null;
};

export type DocsShellAccessibilitySnapshot = {
  hasBannerLandmark: boolean;
  docsNavigationLabel: string;
  hasMainLandmark: boolean;
  hasSearchRegion: boolean;
  hasBreadcrumbNavigation: boolean;
  hasProgressionNavigation: boolean;
  docsRootLabel: string | null;
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
      message: "Docs route must expose a banner landmark",
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
      message: "Docs route must expose a main landmark",
    });
  }

  if (!snapshot.docs.hasSearchRegion) {
    issues.push({
      surface: "docs",
      field: "hasSearchRegion",
      message: "Docs route must expose the preserved search region",
    });
  }

  if (!snapshot.docs.hasBreadcrumbNavigation) {
    issues.push({
      surface: "docs",
      field: "hasBreadcrumbNavigation",
      message: "Docs route must expose breadcrumb navigation",
    });
  }

  if (!snapshot.docs.hasProgressionNavigation) {
    issues.push({
      surface: "docs",
      field: "hasProgressionNavigation",
      message: "Docs route must expose progression navigation",
    });
  }

  if (snapshot.docs.docsRootLabel !== DOCS_ROOT_LABEL) {
    issues.push({
      surface: "docs",
      field: "docsRootLabel",
      message: `Docs route must keep the root context label "${DOCS_ROOT_LABEL}" visible`,
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
