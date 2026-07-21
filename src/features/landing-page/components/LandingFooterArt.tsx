import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { cn } from "@/lib/utils";

export type LandingFooterArtProps = {
  /**
   * Image path for the decorative plate. Defaults to the staged seadragon crop
   * under `/home/`. Callers may override for harness sizing or alternate art.
   */
  src?: string;
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
  className,
}: LandingFooterArtProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-sm",
        "bg-[radial-gradient(ellipse_at_50%_30%,rgba(226,232,240,0.85)_0%,rgba(148,163,184,0.35)_55%,rgba(71,85,105,0.25)_100%)]",
        className,
      )}
      data-landing-footer-art=""
      data-testid="landing-footer-art"
    >
      {/* Soft YOU-field wash behind the plate — decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.28)_48%,transparent_80%)]"
        data-landing-footer-art-field=""
      />
      {/* Purely decorative image — empty alt keeps it out of the a11y name tree. */}
      <img
        src={src}
        alt=""
        className="relative z-[1] mx-auto block h-auto w-full max-h-56 object-contain object-center opacity-90 sm:max-h-72"
        data-landing-footer-art-image=""
        decoding="async"
      />
    </div>
  );
}
