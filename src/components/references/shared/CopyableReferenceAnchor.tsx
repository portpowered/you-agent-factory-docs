"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Link2 } from "lucide-react";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import {
  resolveReferenceChromeForSurface,
  useOptionalReferenceChrome,
} from "@/lib/i18n/reference-chrome-context";
import type { ReferenceFamily } from "@/lib/references/reference-item";
import {
  referenceAnchorUrl,
  referencePagePathForFamily,
} from "@/lib/references/reference-search-projection";
import { cn } from "@/lib/utils";

/** @deprecated Prefer chrome.a11y.copyAnchorLink from reference chrome catalogs. */
export const REFERENCE_ANCHOR_COPY_LABEL = "Copy anchor link";
/** @deprecated Prefer chrome.a11y.anchorLinkCopied from reference chrome catalogs. */
export const REFERENCE_ANCHOR_COPIED_LABEL = "Anchor link copied";

export type CopyableReferenceAnchorProps = {
  /** URL fragment without `#` — must come from ReferenceAnchorRegistry. */
  anchor: string;
  /**
   * Reference family used to build the default owning-page URL for clipboard
   * copy via W04 search projection helpers. Does not wire Orama.
   */
  family: ReferenceFamily;
  /**
   * Optional page path override (defaults to REFERENCE_FAMILY_PAGE_PATHS).
   * Useful for harness mounts that are not production routes.
   */
  pagePath?: string;
  /**
   * When true, copy only `#fragment`. Default copies the owning-page URL
   * (`/docs/references/cli#you-config-init`).
   */
  copyFragmentOnly?: boolean;
  /** Localized reference chrome; falls back to ReferenceChromeProvider. */
  chrome?: ReferenceChromeMessages;
  className?: string;
};

/**
 * Stable, copyable anchor chrome for an addressable reference item.
 *
 * Shows the fragment as a deep-link and a keyboard-accessible copy control.
 * Clipboard text is built with W04 `referenceAnchorUrl` / page-path helpers —
 * never invents a different fragment than the registry-produced `anchor`.
 */
export function CopyableReferenceAnchor({
  anchor,
  family,
  pagePath,
  copyFragmentOnly = false,
  chrome: chromeProp,
  className,
}: CopyableReferenceAnchorProps) {
  const contextChrome = useOptionalReferenceChrome();
  const chrome =
    chromeProp ??
    contextChrome ??
    ({
      a11y: {
        copyAnchorLink: REFERENCE_ANCHOR_COPY_LABEL,
        anchorLinkCopied: REFERENCE_ANCHOR_COPIED_LABEL,
      },
    } as ReferenceChromeMessages);

  const fragment = anchor.trim().replace(/^#/, "");
  const owningPagePath = pagePath ?? referencePagePathForFamily(family);
  const clipboardText = copyFragmentOnly
    ? `#${fragment}`
    : referenceAnchorUrl(owningPagePath, fragment);

  const [checked, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(clipboardText);
  });

  const label = checked
    ? chrome.a11y.anchorLinkCopied
    : chrome.a11y.copyAnchorLink;

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 font-mono text-xs text-muted-foreground",
        className,
      )}
      data-reference-anchor={fragment}
      data-reference-copyable-anchor=""
    >
      <a
        className="truncate text-muted-foreground no-underline hover:text-foreground hover:underline"
        href={`#${fragment}`}
        data-reference-anchor-link=""
      >
        #{fragment}
      </a>
      <button
        type="button"
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={label}
        data-checked={checked || undefined}
        data-reference-anchor-copy=""
        onClick={onClick}
      >
        {checked ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Link2 aria-hidden="true" className="size-3.5" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {checked ? chrome.a11y.anchorLinkCopied : ""}
      </span>
    </div>
  );
}

// Keep helper exported for inventory surfaces that require full chrome.
export { resolveReferenceChromeForSurface };
