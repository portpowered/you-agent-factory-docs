/**
 * Page-local CLI inventory mount for `/docs/references/cli`.
 *
 * Resolves the package CLI contract at build/static-render time (W03 → W04)
 * and passes already-normalized inventory props into the public W10
 * `CliCommandInventory` surface. Server-only — do not import into client
 * bundles.
 */
import { CliCommandInventory } from "@/components/references/cli";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";

export function CliReferenceInventory() {
  const inventory = loadCliReferenceInventory();
  return <CliCommandInventory inventory={inventory} />;
}
