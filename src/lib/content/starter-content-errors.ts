import type { StarterContentValidationFailure } from "@/lib/content/starter";

function formatStarterContentFailure(
  failure: StarterContentValidationFailure,
): string {
  const { contentDirectory, slug, locale } = failure.descriptor;
  const fieldMessages = failure.errors
    .map((error) => `${error.field}: ${error.message}`)
    .join("; ");

  return `${contentDirectory}/${slug}/${locale} — ${fieldMessages}`;
}

export class StarterContentValidationError extends Error {
  readonly failures: StarterContentValidationFailure[];

  constructor(failures: StarterContentValidationFailure[]) {
    const message = failures.map(formatStarterContentFailure).join("\n");
    super(
      failures.length === 1
        ? `Starter content validation failed: ${message}`
        : `Starter content validation failed for ${failures.length} fixtures:\n${message}`,
    );
    this.name = "StarterContentValidationError";
    this.failures = failures;
  }
}

export function assertStarterContentValid(
  failures: StarterContentValidationFailure[],
): void {
  if (failures.length > 0) {
    throw new StarterContentValidationError(failures);
  }
}
