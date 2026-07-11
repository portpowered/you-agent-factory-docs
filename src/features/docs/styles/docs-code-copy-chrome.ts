/**
 * Shared fenced-code copy control chrome contract.
 *
 * Host `DocsCodeCopyButton` owns clipboard + checkmark + accessible copied
 * status. CSS keeps the affordance visible and uses secondary blue for
 * hover/focus/checked (avoid Fumadocs accent-foreground → accent-ink trap).
 */

import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";

/** Marker attribute on the copy control button inside DocsCodeBlock actions. */
export const DOCS_CODE_COPY_CONTROL_ATTR = "data-docs-code-copy" as const;
export const DOCS_CODE_COPY_CONTROL_VALUE = "control" as const;

/** Live-region marker for accessible copied-state announcements. */
export const DOCS_CODE_COPY_STATUS_ATTR = "data-docs-code-copy-status" as const;

/** Class applied to the host copy button for persistent secondary chrome. */
export const DOCS_CODE_COPY_BUTTON_CLASS = "docs-code-block__copy-button";

/** Default accessible name (matches Fumadocs i18n `codeBlockCopy`). */
export const DOCS_CODE_COPY_LABEL = "Copy Text";

/** Copied-state accessible name (matches Fumadocs i18n `codeBlockCopied`). */
export const DOCS_CODE_COPY_COPIED_LABEL = "Copied Text";

/**
 * Reset window after a successful copy (ms). Matches fumadocs-ui
 * `useCopyButton` timeout so the control returns to the default affordance.
 */
export const DOCS_CODE_COPY_RESET_MS = 1500;

/** Selector for regions excluded from clipboard text (Fumadocs contract). */
export const DOCS_CODE_COPY_IGNORE_SELECTOR = ".nd-copy-ignore";

/**
 * Semantic CSS custom properties used for rest / hover / focus / copied chrome.
 * Values resolve through host shadcn → factory-dark foundation bindings.
 */
export const DOCS_CODE_COPY_CHROME_TOKENS = {
  /** Resting icon color — cool secondary ink, always visible. */
  restColor: "var(--muted-foreground)",
  /** Hover / focus / copied icon color — cool secondary blue. */
  interactiveColor: "var(--secondary)",
  /** Soft secondary wash behind the control on hover/focus/copied. */
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
