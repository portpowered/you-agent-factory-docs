/**
 * Page-local JavaScript runtime inventory mount for
 * `/docs/references/javascript-runtime`.
 *
 * Resolves the package JavaScript runtime contract at build/static-render time
 * (W03 → W04) and passes already-normalized inventory props into the public
 * W10 `JavaScriptRuntimeInventory` surface. Server-only — do not import into
 * client bundles.
 */
import {
  JavaScriptRuntimeInventory,
  type JavaScriptRuntimeInventoryInput,
} from "@/components/references/javascript";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";

export type JavascriptRuntimeReferenceInventoryProps = {
  /**
   * Optional inventory override for page-local empty/error proofs.
   * Production MDX omits this and loads the package contract.
   */
  inventory?: JavaScriptRuntimeInventoryInput;
};

export function JavascriptRuntimeReferenceInventory({
  inventory,
}: JavascriptRuntimeReferenceInventoryProps = {}) {
  const resolved = inventory ?? loadJavascriptRuntimeReferenceInventory();
  return <JavaScriptRuntimeInventory inventory={resolved} />;
}
