/**
 * Shared content-column alignment contract for shell surfaces.
 *
 * Matches Fumadocs DocsPage `#nd-page` horizontal inset
 * (`px-4 md:px-6 xl:px-8`) so header/docs nav, home article/Browse, /browse,
 * /blog, and normal docs content columns can target the same left edge without
 * per-page padding forks or negative-margin compensation.
 */

/** CSS custom property names set on `:root` in `src/app/globals.css`. */
export const CONTENT_COLUMN_CSS_VARS = {
  insetMobile: "--site-content-column-inset-mobile",
  insetMd: "--site-content-column-inset-md",
  insetXl: "--site-content-column-inset-xl",
  maxWidth: "--site-content-column-max-width",
  maxWidthFull: "--site-content-column-max-width-full",
} as const;

/** Horizontal inset token values (CSS lengths). */
export const CONTENT_COLUMN_INSET = {
  /** Default / mobile inset — Tailwind `px-4`. */
  mobile: "1rem",
  /** `md` and up — Tailwind `md:px-6`. */
  md: "1.5rem",
  /** `xl` and up — Tailwind `xl:px-8`. */
  xl: "2rem",
} as const;

/** Content-column max-width tokens matching Fumadocs DocsPage container. */
export const CONTENT_COLUMN_MAX_WIDTH = {
  /** Standard article / primary-nav column. */
  default: "900px",
  /** Full-width column (article + TOC span). */
  full: "1168px",
} as const;

/**
 * Shared horizontal padding utilities for shell content columns.
 * Apply this inset directly — do not fake alignment with negative margins.
 */
export const CONTENT_COLUMN_INSET_CLASS = "px-4 md:px-6 xl:px-8";

/** Centered standard content column (max-width + shared inset). */
export const CONTENT_COLUMN_CLASS = `mx-auto w-full max-w-[900px] ${CONTENT_COLUMN_INSET_CLASS}`;

/** Centered full content column (article + TOC span + shared inset). */
export const CONTENT_COLUMN_FULL_CLASS = `mx-auto w-full max-w-[1168px] ${CONTENT_COLUMN_INSET_CLASS}`;

/**
 * Shell surfaces that must consume this contract for the shared left edge.
 * Later stories wire each surface; this list documents the intended consumers.
 */
export const CONTENT_COLUMN_CONSUMER_SURFACES = [
  "header-docs-nav",
  "home-article-browse",
  "browse-index",
  "blog-index",
  "docs-page",
] as const;

export type ContentColumnConsumerSurface =
  (typeof CONTENT_COLUMN_CONSUMER_SURFACES)[number];

/** True when a class string uses negative-margin compensation (forbidden). */
export function usesNegativeMarginCompensation(className: string): boolean {
  return /(?:^|\s)-m[trblxy]?-/.test(className);
}
