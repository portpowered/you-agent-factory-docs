import { PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";

export const REQUIRED_FOUNDATION_CONTENT_FIELDS = [
  "PROJECT_NAME",
  "PROJECT_TAGLINE",
] as const;

export type FoundationContentField =
  (typeof REQUIRED_FOUNDATION_CONTENT_FIELDS)[number];

export type FoundationContentMetadata = Record<FoundationContentField, string>;

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

/** Reads canonical project metadata for the current bootstrap content model. */
export function getFoundationContentMetadata(): FoundationContentMetadata {
  return {
    PROJECT_NAME,
    PROJECT_TAGLINE,
  };
}

/** Validates canonical project metadata for the current bootstrap content model. */
export function validateFoundationContentMetadata(
  metadata: FoundationContentMetadata = getFoundationContentMetadata(),
): FoundationContentValidationResult {
  const issues: FoundationContentIssue[] = [];

  for (const field of REQUIRED_FOUNDATION_CONTENT_FIELDS) {
    if (!(field in metadata)) {
      issues.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }

    const value = metadata[field];
    if (!isNonEmptyString(value)) {
      issues.push({
        field,
        message: `${field} must be a non-empty string`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when foundation content metadata fails validation. */
export function assertValidFoundationContentMetadata(
  metadata: FoundationContentMetadata = getFoundationContentMetadata(),
): void {
  const result = validateFoundationContentMetadata(metadata);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Foundation content validation failed:\n${details}`);
}
