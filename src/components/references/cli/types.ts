/**
 * Prop contracts for W10 CLI family reference renderers.
 *
 * Callers pass already-normalized CLI projections (W03 → W04). These types do
 * not acquire package artifacts or invent missing flags/arguments.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import type { CliCommandWithStructuredOptions } from "./cli-capability";

export type CliCommandReferenceProps = {
  /**
   * Normalized CLI command. May carry optional enriched `flags` / `arguments`
   * bags; when those are absent or empty, CliCapabilityNotice is shown.
   */
  command: CliCommandWithStructuredOptions;
  /**
   * Package version when known from the resolved manifest identity. Kept for
   * inventory callers; command cards no longer render package/source badge
   * chrome. Absent when the caller has no package version — never invent a
   * version string.
   */
  packageVersion?: string;
  /** Localized reference chrome forwarded to the stable-anchor copy control. */
  chrome?: ReferenceChromeMessages;
  className?: string;
};

/**
 * Under-construction notice when structured flags/arguments are not yet
 * published. Optional title/description override defaults from
 * `cli-capability.ts` — never used to invent option rows.
 */
export type CliCapabilityNoticeProps = {
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Inventory input for the CLI reference list. Success carries normalized
 * commands only — never page-local copied inventory JSON as source of truth.
 */
export type CliCommandInventoryInput =
  | {
      state: "success";
      commands: readonly CliCommandNormalized[];
      packageVersion?: string;
    }
  | { state: "empty" }
  | { state: "error"; detail?: string };

export type CliCommandInventoryProps = {
  inventory: CliCommandInventoryInput;
  className?: string;
};
