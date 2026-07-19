/**
 * Page-local MDX components for references/javascript-runtime.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import {
  JavaScriptRuntimeInventoryChrome,
  JavaScriptRuntimeSharedSchemasList,
  JavaScriptRuntimeSymbolsList,
} from "@/components/references/javascript";
import { JavascriptRuntimeOverallExample } from "./JavascriptRuntimeOverallExample";
import { JavascriptRuntimeReferenceInventory } from "./JavascriptRuntimeReferenceInventory";
import { JavascriptSymbolMetadataGlossary } from "./JavascriptSymbolMetadataGlossary";

export const pageMdxComponents = {
  JavascriptRuntimeReferenceInventory,
  JavascriptRuntimeInventoryChrome: JavaScriptRuntimeInventoryChrome,
  JavascriptRuntimeSymbolsList: JavaScriptRuntimeSymbolsList,
  JavascriptRuntimeSharedSchemasList: JavaScriptRuntimeSharedSchemasList,
  JavascriptSymbolMetadataGlossary,
  JavascriptRuntimeOverallExample,
};
