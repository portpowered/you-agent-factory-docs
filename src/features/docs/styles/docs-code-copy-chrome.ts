/**
 * Shared fenced-code copy control chrome contract.
 *
 * Fumadocs CopyButton uses `hover:text-fd-accent-foreground`, which resolves to
 * dark accent-ink on factory-dark and makes the icon disappear on hover.
 * Host CSS in `docs-code-block.css` overrides that with secondary blue.
 */

import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";

/** Marker attribute on the copy control button inside DocsCodeBlock actions. */
export const DOCS_CODE_COPY_CONTROL_ATTR = "data-docs-code-copy" as const;
export const DOCS_CODE_COPY_CONTROL_VALUE = "control" as const;

/** Class applied to the Fumadocs copy button for persistent secondary chrome. */
export const DOCS_CODE_COPY_BUTTON_CLASS = "docs-code-block__copy-button";

/**
 * Semantic CSS custom properties used for rest / hover / focus copy chrome.
 * Values resolve through host shadcn → factory-dark foundation bindings.
 */
export const DOCS_CODE_COPY_CHROME_TOKENS = {
  /** Resting icon color — cool secondary ink, always visible. */
  restColor: "var(--muted-foreground)",
  /** Hover / focus icon color — cool secondary blue. */
  interactiveColor: "var(--secondary)",
  /** Soft secondary wash behind the control on hover/focus. */
  interactiveBackground:
    "color-mix(in oklab, var(--secondary) 22%, transparent)",
  /** Keyboard focus ring uses secondary (not yellow primary) for this control. */
  focusRing: "var(--secondary)",
} as const;

/** Concrete factory-dark hex proofs for the secondary blue treatment. */
export const DOCS_CODE_COPY_CHROME_FACTORY_DARK = {
  restColor: FACTORY_DARK_FOUNDATION.secondaryAccentInk,
  interactiveColor: FACTORY_DARK_FOUNDATION.secondaryAccent,
} as const;
