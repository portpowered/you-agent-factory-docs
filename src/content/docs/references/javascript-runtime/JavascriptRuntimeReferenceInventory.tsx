/**
 * Page-local JavaScript runtime inventory mount for
 * `/docs/references/javascript-runtime`.
 *
 * Resolves the package JavaScript runtime contract at build/static-render time
 * (W03 → W04) and passes already-normalized inventory props into the public
 * W10 `JavaScriptRuntimeInventory` surface. Server-only — do not import into
 * client bundles.
 *
 * With `children`, wraps composed MDX sections (filter chrome + Symbols /
 * Shared schemas lists) in the shared inventory provider so On this page can
 * own those section anchors. Without `children`, renders the standalone
 * inventory layout used by harness mounts.
 */
import type { ReactNode } from "react";
import {
  JavaScriptRuntimeInventory,
  type JavaScriptRuntimeInventoryInput,
  JavaScriptRuntimeInventoryProvider,
} from "@/features/references/javascript";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";

export type JavascriptRuntimeReferenceInventoryProps = {
  /**
   * Optional inventory override for page-local empty/error proofs.
   * Production MDX omits this and loads the package contract.
   */
  inventory?: JavaScriptRuntimeInventoryInput;
  /**
   * Optional composed layout (chrome + section lists). When omitted, renders
   * the standalone inventory with local Symbols / Shared schemas headings.
   */
  children?: ReactNode;
};

export function JavascriptRuntimeReferenceInventory({
  inventory,
  children,
}: JavascriptRuntimeReferenceInventoryProps = {}) {
  const resolved = inventory ?? loadJavascriptRuntimeReferenceInventory();
  if (children !== undefined) {
    return (
      <JavaScriptRuntimeInventoryProvider inventory={resolved}>
        {children}
      </JavaScriptRuntimeInventoryProvider>
    );
  }
  return <JavaScriptRuntimeInventory inventory={resolved} />;
}
