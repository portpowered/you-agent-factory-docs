/**
 * Page-local CLI inventory mount for `/docs/references/cli`.
 *
 * Resolves the package CLI contract at build/static-render time (W03 → W04)
 * and passes already-normalized inventory props into the public W10
 * `CliCommandInventory` surface. Server-only — do not import into client
 * bundles.
 */
import {
  CliCommandInventory,
  type CliCommandInventoryInput,
} from "@/features/references/cli";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";

export type CliReferenceInventoryProps = {
  /**
   * Optional inventory override for page-local empty/error proofs.
   * Production MDX omits this and loads the package contract.
   */
  inventory?: CliCommandInventoryInput;
};

export function CliReferenceInventory({
  inventory,
}: CliReferenceInventoryProps = {}) {
  const resolved = inventory ?? loadCliReferenceInventory();
  return <CliCommandInventory inventory={resolved} />;
}
