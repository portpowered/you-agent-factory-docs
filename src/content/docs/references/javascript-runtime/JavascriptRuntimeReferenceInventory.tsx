/**
 * Page-local JavaScript runtime inventory mount for
 * `/docs/references/javascript-runtime`.
 *
 * Resolves the package JavaScript runtime contract at build/static-render time
 * (W03 → W04) and passes already-normalized inventory props into the public
 * W10 `JavaScriptRuntimeInventory` surface. Server-only — do not import into
 * client bundles.
 */
import { JavaScriptRuntimeInventory } from "@/components/references/javascript";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";

export function JavascriptRuntimeReferenceInventory() {
  const inventory = loadJavascriptRuntimeReferenceInventory();
  return <JavaScriptRuntimeInventory inventory={inventory} />;
}
