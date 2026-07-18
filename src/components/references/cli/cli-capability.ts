/**
 * Pure helpers for CLI structured flags/arguments capability disclosure.
 *
 * The published `cli-command-identity/v1` contract does not currently ship
 * machine-readable flags or arguments. These helpers detect when an enriched
 * projection (or future contract) actually carries structured option data so
 * CliCapabilityNotice can stay hidden — without inventing option rows.
 */

import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";

/**
 * Optional structured option bags that may appear on an enriched CLI
 * projection. Absent or empty means the published contract did not provide
 * machine-readable flags/arguments.
 */
export type CliCommandStructuredOptionsProjection = {
  flags?: readonly unknown[];
  arguments?: readonly unknown[];
};

export type CliCommandWithStructuredOptions = CliCommandNormalized &
  CliCommandStructuredOptionsProjection;

/**
 * True when the command projection carries at least one structured flag or
 * argument entry. Empty arrays and missing fields count as unavailable.
 */
export function cliCommandHasStructuredOptions(
  command: CliCommandWithStructuredOptions,
): boolean {
  const hasFlags = Array.isArray(command.flags) && command.flags.length > 0;
  const hasArguments =
    Array.isArray(command.arguments) && command.arguments.length > 0;
  return hasFlags || hasArguments;
}

/** Copy used by CliCapabilityNotice when structured options are unavailable. */
export const CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE =
  "Structured flags and arguments unavailable";

export const CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION =
  "The published CLI contract does not include machine-readable flags or arguments for this command. Use published help text and examples when present; this reference does not invent option names, defaults, conflicts, or validation rules.";
