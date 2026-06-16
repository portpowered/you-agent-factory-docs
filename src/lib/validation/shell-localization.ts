import * as shell from "@/lib/shell";

export type ShellLocalizationIssue = {
  key: string;
  message: string;
};

export type ShellLocalizationValidationResult = {
  valid: boolean;
  issues: ShellLocalizationIssue[];
};

const REQUIRED_SHELL_STRING_KEYS = [
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validates shared shell copy constants used before full message catalogs land. */
export function validateShellLocalizationCopy(): ShellLocalizationValidationResult {
  const issues: ShellLocalizationIssue[] = [];

  for (const key of REQUIRED_SHELL_STRING_KEYS) {
    const value = shell[key];
    if (!isNonEmptyString(value)) {
      issues.push({
        key,
        message: `${key} must be a non-empty string`,
      });
    }
  }

  const githubUrl = shell.GITHUB_REPO_URL;
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
export function assertValidShellLocalizationCopy(): void {
  const result = validateShellLocalizationCopy();
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.key}: ${issue.message}`)
    .join("\n");

  throw new Error(`Shell localization validation failed:\n${details}`);
}
