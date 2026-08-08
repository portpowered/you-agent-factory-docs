/**
 * Two type scales for the W07 schema surface.
 *
 * `embed` is the historical scale: a schema definition dropped inside authored
 * prose, where the surrounding page owns the heading hierarchy and the embed
 * must sit quietly beneath it. Every `*SchemaEmbed` mount keeps this.
 *
 * `page` is for a route whose whole body *is* the schema — the definition title
 * is the page's primary landmark, so it carries real weight and steps down to
 * its own sub-sections. It also zeroes margins: these surfaces render inside
 * fumadocs prose, where `.prose h3` (0,1,1) outranks a bare `m-0` utility
 * (0,1,0), so the reset has to come from a `not-prose` root plus explicit
 * spacing rather than from utility margins that never apply.
 */

export const SCHEMA_TYPE_SCALES = ["embed", "page"] as const;
export type SchemaTypeScale = (typeof SCHEMA_TYPE_SCALES)[number];

/** Definition title — the name of one schema object. */
export const SCHEMA_DEFINITION_TITLE_CLASS: Record<SchemaTypeScale, string> = {
  embed: "font-semibold text-foreground text-lg",
  page: "m-0 font-mono font-bold text-2xl text-foreground leading-tight tracking-tight",
};

/** Sub-section heading inside a definition: Fields, Examples, One of, … */
export const SCHEMA_SECTION_HEADING_CLASS: Record<SchemaTypeScale, string> = {
  embed: "font-medium text-foreground text-sm",
  page: "m-0 font-bold text-base text-foreground tracking-tight",
};

/**
 * Heading element for a definition title. On a schema page the group section
 * owns `h2`, so definitions step down to `h3` and their sub-sections to `h4`.
 */
export const SCHEMA_DEFINITION_TITLE_TAG: Record<SchemaTypeScale, "h2" | "h3"> =
  {
    embed: "h2",
    page: "h3",
  };

export const SCHEMA_SECTION_HEADING_TAG: Record<SchemaTypeScale, "h3" | "h4"> =
  {
    embed: "h3",
    page: "h4",
  };
