import * as shell from "@/lib/shell";

export const REQUIRED_SHELL_STRING_KEYS = [
  "GITHUB_REPO_URL",
  "GITHUB_CTA_LABEL",
  "DOCS_CTA_LABEL",
  "HOME_CTA_LABEL",
  "LANDING_VALUE_STATEMENT",
  "DOCS_SHELL_TITLE",
  "DOCS_NAV_HEADING",
  "DOCS_NAV_OVERVIEW_LABEL",
  "DOCS_SHELL_FRAMING_TEXT",
] as const satisfies readonly (keyof typeof shell)[];

export type ShellLocalizationKey = (typeof REQUIRED_SHELL_STRING_KEYS)[number];

export type ShellLocalizationCopy = Record<ShellLocalizationKey, string>;

export type ShellLocalizationIssue = {
  key: string;
  message: string;
};

export type ShellLocalizationValidationResult = {
  valid: boolean;
  issues: ShellLocalizationIssue[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Reads the current shared shell copy constants used before full message catalogs land. */
export function getShellLocalizationCopy(): ShellLocalizationCopy {
  return {
    GITHUB_REPO_URL: shell.GITHUB_REPO_URL,
    GITHUB_CTA_LABEL: shell.GITHUB_CTA_LABEL,
    DOCS_CTA_LABEL: shell.DOCS_CTA_LABEL,
    HOME_CTA_LABEL: shell.HOME_CTA_LABEL,
    LANDING_VALUE_STATEMENT: shell.LANDING_VALUE_STATEMENT,
    DOCS_SHELL_TITLE: shell.DOCS_SHELL_TITLE,
    DOCS_NAV_HEADING: shell.DOCS_NAV_HEADING,
    DOCS_NAV_OVERVIEW_LABEL: shell.DOCS_NAV_OVERVIEW_LABEL,
    DOCS_SHELL_FRAMING_TEXT: shell.DOCS_SHELL_FRAMING_TEXT,
  };
}

/** Validates shared shell copy constants used before full message catalogs land. */
export function validateShellLocalizationCopy(
  copy: ShellLocalizationCopy = getShellLocalizationCopy(),
): ShellLocalizationValidationResult {
  const issues: ShellLocalizationIssue[] = [];

  for (const key of REQUIRED_SHELL_STRING_KEYS) {
    if (!(key in copy)) {
      issues.push({
        key,
        message: `${key} is required`,
      });
      continue;
    }

    const value = copy[key];
    if (!isNonEmptyString(value)) {
      issues.push({
        key,
        message: `${key} must be a non-empty string`,
      });
    }
  }

  const githubUrl = copy.GITHUB_REPO_URL;
  if (isNonEmptyString(githubUrl)) {
    try {
      const parsed = new URL(githubUrl);
      if (parsed.protocol !== "https:") {
        issues.push({
          key: "GITHUB_REPO_URL",
          message: "GITHUB_REPO_URL must use https",
        });
      }
    } catch {
      issues.push({
        key: "GITHUB_REPO_URL",
        message: "GITHUB_REPO_URL must be a valid absolute URL",
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when shared shell localization copy fails validation. */
export function assertValidShellLocalizationCopy(
  copy: ShellLocalizationCopy = getShellLocalizationCopy(),
): void {
  const result = validateShellLocalizationCopy(copy);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.key}: ${issue.message}`)
    .join("\n");

  throw new Error(`Shell localization validation failed:\n${details}`);
}
