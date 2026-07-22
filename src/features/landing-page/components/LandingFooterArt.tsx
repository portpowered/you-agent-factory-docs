"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";
import { CODE_BLOCK_COPY_RESET_MS } from "@/features/code/CodeBlock";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { cn } from "@/lib/utils";

export const LANDING_FOOTER_COMMAND =
  "curl -fsSL https://youagentfactory.com/install.sh | sh";

export const LANDING_FOOTER_COMMAND_LABEL = "Install you-agent-factory";

export type LandingFooterArtProps = {
  /**
   * Image path for the decorative plate. Defaults to the staged seadragon crop
   * under `/home/`. Callers may override for harness sizing or alternate art.
   */
  src?: string;
  /** Repeated YOU typography plate behind the seadragon. */
  fieldSrc?: string;
  /** Optional sizing / layout classes from harness or SiteFooter consumers. */
  className?: string;
};

/**
 * Decorative footer art for SiteFooter's opaque `art` slot.
 * Owned by W-faq-cta — static seadragon / YOU-field plate (no OpenSeadragon viewer).
 * Does not edit `src/features/footer/**`.
 */
export function LandingFooterArt({
  src = landingHomeAssets.seadragonCrop,
  fieldSrc = landingHomeAssets.youYouYouBackground,
  className,
}: LandingFooterArtProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(
      () => setCopied(false),
      CODE_BLOCK_COPY_RESET_MS,
    );
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(LANDING_FOOTER_COMMAND);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border-0 bg-[#dfd6c5] pt-14 pb-8",
        className,
      )}
      data-landing-footer-art=""
      data-testid="landing-footer-art"
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-0"
        data-landing-footer-art-field=""
        decoding="async"
        src={fieldSrc}
      />
      <div className="relative z-10 mx-auto mb-6 flex w-[min(92%,48rem)] items-center rounded-sm bg-[#191f2b] px-3 py-1.5 text-[#ecece4] sm:px-5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-center font-sans text-xs sm:text-sm">
          {LANDING_FOOTER_COMMAND}
        </code>
        <span className="sr-only">{LANDING_FOOTER_COMMAND_LABEL}</span>
        <button
          aria-label={
            copied ? "Install command copied" : "Copy install command"
          }
          className="ml-3 grid size-8 shrink-0 place-items-center rounded-sm border border-[#ecece4]/30 transition-colors hover:bg-[#ecece4] hover:text-[#191f2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3bd3d]"
          data-landing-footer-command-copy=""
          onClick={() => void copyInstallCommand()}
          type="button"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Clipboard aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {/* Purely decorative image — empty alt keeps it out of the a11y name tree. */}
      <img
        src={src}
        alt=""
        className="relative z-[1] mx-auto block h-auto w-full max-w-none object-contain object-center"
        data-landing-footer-art-image=""
        decoding="async"
      />
    </div>
  );
}
