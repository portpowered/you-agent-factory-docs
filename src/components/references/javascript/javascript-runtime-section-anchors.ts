/**
 * Stable on-page section anchors for the JavaScript runtime inventory.
 *
 * These ids must match the MDX `<Section id="…">` entries that feed
 * `buildLocalDocsTableOfContents` so On this page can jump to Symbols and
 * Shared schemas.
 */
export const JAVASCRIPT_RUNTIME_SECTION_ANCHORS = {
  symbols: "symbols",
  sharedSchemas: "shared-schemas",
} as const;

export type JavascriptRuntimeSectionAnchor =
  (typeof JAVASCRIPT_RUNTIME_SECTION_ANCHORS)[keyof typeof JAVASCRIPT_RUNTIME_SECTION_ANCHORS];
