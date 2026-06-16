import { PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";

export type FoundationContentIssue = {
  field: string;
  message: string;
};

export type FoundationContentValidationResult = {
  valid: boolean;
  issues: FoundationContentIssue[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validates canonical project metadata for the current bootstrap content model. */
export function validateFoundationContentMetadata(): FoundationContentValidationResult {
  const issues: FoundationContentIssue[] = [];

  if (!isNonEmptyString(PROJECT_NAME)) {
    issues.push({
      field: "PROJECT_NAME",
      message: "PROJECT_NAME must be a non-empty string",
    });
  }

  if (!isNonEmptyString(PROJECT_TAGLINE)) {
    issues.push({
      field: "PROJECT_TAGLINE",
      message: "PROJECT_TAGLINE must be a non-empty string",
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when foundation content metadata fails validation. */
export function assertValidFoundationContentMetadata(): void {
  const result = validateFoundationContentMetadata();
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Foundation content validation failed:\n${details}`);
}
