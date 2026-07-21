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
};

const CTA_CONTROL_CLASS = cn(
  "inline-flex items-center justify-center rounded-md px-5 py-2.5",
  "bg-foreground text-background text-sm font-semibold tracking-tight",
  "shadow-sm transition-colors hover:bg-foreground/90",
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
}: CtaBandProps) {
  return (
    <section
      aria-label={headline}
      className={cn(
        "relative w-full overflow-hidden px-6 py-16 text-foreground",
        className,
      )}
      data-landing-cta-band=""
    >
      {/* Fog plate — image when staged; CSS mist always present for atmosphere. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        data-landing-cta-fog=""
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
          style={{ backgroundImage: `url(${fogSrc})` }}
          data-landing-cta-fog-image=""
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.35)_0%,rgba(226,232,240,0.55)_45%,rgba(203,213,225,0.7)_100%)]"
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
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-4">
        <h2
          className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          data-landing-cta-headline=""
        >
          {headline}
        </h2>

        {supporting ? (
          <p
            className="max-w-2xl text-base text-muted-foreground text-pretty"
            data-landing-cta-supporting=""
          >
            {supporting}
          </p>
        ) : null}

        {installCommand ? (
          <code
            className={cn(
              "rounded-md border border-border/70 bg-background/70 px-3 py-2",
              "font-mono text-sm text-foreground/90 backdrop-blur-sm",
            )}
            data-landing-cta-command=""
          >
            {installCommand}
          </code>
        ) : null}

        {ctaHref ? (
          <a
            href={ctaHref}
            className={CTA_CONTROL_CLASS}
            data-landing-cta-action=""
          >
            {ctaLabel}
          </a>
        ) : (
          <button
            type="button"
            className={CTA_CONTROL_CLASS}
            data-landing-cta-action=""
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </section>
  );
}
