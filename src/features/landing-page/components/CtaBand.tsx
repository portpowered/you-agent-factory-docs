import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { cn } from "@/lib/utils";

export type CtaBandProps = {
  /** Primary headline for the install / continue band. */
  headline: string;
  /** Visible label on the primary CTA control. */
  ctaLabel: string;
  /**
   * When provided, the primary CTA is a real navigable anchor whose `href`
   * matches this value. When omitted, the CTA renders as a focusable button.
   */
  ctaHref?: string;
  /** Optional supporting sentence under the headline. */
  supporting?: string;
  /** Optional install / command string shown near the CTA. */
  installCommand?: string;
  /**
   * Fog / mist image path. Defaults to the staged `/home/cta-fog.png` asset.
   * Overlay gradients still apply when the image is unavailable.
   */
  fogSrc?: string;
  className?: string;
  /** Fog card by default; overlay keeps the shared whale scene visible. */
  surface?: "fog" | "overlay";
  /** Hide the control when the reference composition is a text-only banner. */
  showAction?: boolean;
};

/**
 * Vertical fade applied to the fog plate so it has no hard top or bottom edge.
 * `mask-image` is prefixed for WebKit, which still needs `-webkit-mask-image`
 * for gradient masks.
 */
const FOG_PLATE_FEATHER_CLASS = cn(
  "[mask-image:linear-gradient(180deg,transparent_0%,black_22%,black_78%,transparent_100%)]",
  "[-webkit-mask-image:linear-gradient(180deg,transparent_0%,black_22%,black_78%,transparent_100%)]",
);

const CTA_CONTROL_CLASS = cn(
  "inline-flex items-center justify-center border-2 border-[#191f2b] px-6 py-3",
  "bg-[#f3bd3d] font-mono text-sm font-black tracking-[0.08em] text-[#191f2b] uppercase",
  "shadow-[5px_5px_0_#191f2b] transition-transform hover:-translate-y-0.5",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "motion-reduce:transition-none",
);

/**
 * Landing-page CTA band: fogged atmosphere + install call-to-action.
 * Owned by W-faq-cta — fog/mist stays local (no whale wipe coupling).
 */
export function CtaBand({
  headline,
  ctaLabel,
  ctaHref,
  supporting,
  installCommand,
  fogSrc = landingHomeAssets.ctaFog,
  className,
  surface = "fog",
  showAction = true,
}: CtaBandProps) {
  return (
    <section
      aria-label={headline}
      className={cn(
        "relative w-full overflow-visible px-5 text-[#191f2b] sm:px-8",
        surface === "overlay" ? "py-16 sm:py-20" : "py-24 sm:py-32",
        surface === "fog" ? "bg-[#c8b9c4]" : "bg-transparent",
        className,
      )}
      data-landing-cta-band=""
      data-landing-cta-surface={surface}
    >
      {/* Fog plate — image when staged; CSS mist always present for atmosphere. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        data-landing-cta-fog=""
      >
        {/*
         * The plate is taller than the band and feathered at both ends. Clipped
         * to the section it ended on two hard horizontal seams, which read as
         * the background being cut off rather than as mist sitting in the
         * scene. The mask lets it dissolve into the artwork above and below.
         */}
        <div
          className={cn(
            "absolute inset-y-[-18%] left-1/2 w-[120%] -translate-x-1/2 bg-center bg-no-repeat opacity-95 mix-blend-screen",
            "bg-cover",
            FOG_PLATE_FEATHER_CLASS,
          )}
          style={{ backgroundImage: `url(${fogSrc})` }}
          data-landing-cta-fog-image=""
        />
        {surface === "fog" ? (
          <>
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(219,207,191,0.42)_0%,rgba(200,185,196,0.55)_48%,rgba(25,31,43,0.12)_100%)]"
              data-landing-cta-fog-mist=""
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(226,236,245,0.55)_0%,transparent_55%)]"
              data-landing-cta-fog-haze=""
            />
            <div
              className={cn(
                "absolute inset-0 opacity-80",
                "bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.35)_48%,transparent_72%)]",
                "motion-safe:animate-pulse motion-reduce:animate-none",
              )}
              data-landing-cta-fog-drift=""
            />
          </>
        ) : null}
      </div>

      <div
        className={cn(
          // Left-aligned on every surface so the CTA headline shares the left
          // edge with the hero and capability copy above it.
          "relative mx-auto flex max-w-6xl flex-col items-start gap-5",
          surface !== "fog" && "text-left text-[#191f2b]",
        )}
      >
        <h2
          className={cn(
            // One line. `text-balance` plus a 5xl cap wrapped "YOU SHOULD
            // INSTALL YOU" across two lines; the clamp is sized off viewport
            // width so the line fits at every size instead of breaking.
            "max-w-none whitespace-nowrap font-sans text-[clamp(1.5rem,5.2vw,5.4rem)] leading-[0.9] font-normal tracking-[-0.065em] uppercase",
            "text-[#191f2b]",
          )}
          data-landing-cta-headline=""
        >
          {headline}
        </h2>

        {supporting ? (
          <p
            className="max-w-2xl font-mono text-sm font-semibold tracking-wide uppercase sm:text-base"
            data-landing-cta-supporting=""
          >
            {supporting}
          </p>
        ) : null}

        {installCommand ? (
          <code
            className={cn(
              "max-w-full overflow-x-auto border border-[#191f2b]/60 bg-[#ecece4]/65 px-3 py-2",
              "font-mono text-xs text-[#191f2b] backdrop-blur-sm sm:text-sm",
            )}
            data-landing-cta-command=""
          >
            {installCommand}
          </code>
        ) : null}

        {showAction && ctaHref ? (
          <a
            href={ctaHref}
            className={CTA_CONTROL_CLASS}
            data-landing-cta-action=""
          >
            {ctaLabel}
          </a>
        ) : showAction ? (
          <button
            type="button"
            className={CTA_CONTROL_CLASS}
            data-landing-cta-action=""
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
