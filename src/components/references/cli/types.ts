/**
 * Prop contracts for W10 CLI family reference renderers.
 *
 * Callers pass already-normalized CLI projections (W03 → W04). These types do
 * not acquire package artifacts or invent missing flags/arguments.
 */

import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";

export type CliCommandReferenceProps = {
  command: CliCommandNormalized;
  /**
   * Package version when known from the resolved manifest identity. Absent
   * when the caller has no package version — never invent a version string.
   */
  packageVersion?: string;
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
