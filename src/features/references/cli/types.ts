/**
 * Prop contracts for W10 CLI family reference renderers.
 *
 * Callers pass already-normalized CLI projections (W03 → W04). These types do
 * not acquire package artifacts or invent missing flags/arguments.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";

export type CliCommandReferenceProps = {
  /**
   * Normalized CLI command, including the published flags and arguments when
   * the contract carries them. Absent option bags render no table — the card
   * never substitutes invented rows.
   */
  command: CliCommandNormalized;
  /**
   * Package version when known from the resolved manifest identity. Kept for
   * inventory callers; command cards no longer render package/source badge
   * chrome. Absent when the caller has no package version — never invent a
   * version string.
   */
  packageVersion?: string;
  /** Localized reference chrome forwarded to the stable-anchor copy control. */
  chrome?: ReferenceChromeMessages;
  /**
   * Anchor of the root command, where inherited global flags are documented in
   * full. Absent when the root command is not part of the rendered inventory.
   */
  rootAnchor?: string;
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
