"use client";

/**
 * Empty Fumadocs sidebar navTitle slot.
 *
 * Must be a client module export (not an inline `() => null`) so DocsLayout can
 * serialize the slot across the RSC boundary. Header brand chrome owns the
 * visible mark; the desktop sidebar must not repeat it via InlineNavTitle.
 */
export function EmptyDocsNavTitle() {
  return null;
}
