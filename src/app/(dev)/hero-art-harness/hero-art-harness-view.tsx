import {
  CapabilityStrip,
  HeroSection,
  TornEdge,
  YouiShowcase,
} from "@/features/landing-page";

/**
 * Stacked W-hero-art sections on a neutral/skeleton background.
 *
 * TornEdge is used in two places (after hero chrome, before Youi) so reviewers
 * can confirm the reusable edge mask. Sphere/terminal holes use HeroSection
 * placeholders — this view does not re-implement Wave A internals.
 * Mounted only from the gated `(dev)/hero-art-harness` route.
 */
export function HeroArtHarnessView() {
  return (
    <main
      className="min-h-screen bg-neutral-100 text-neutral-900"
      data-hero-art-harness=""
    >
      <header className="border-b border-neutral-300/80 bg-neutral-50 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
            Dev harness
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Hero art pieces
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Stacked portrait / capability / Youi sections with TornEdge in two
            places. Neutral skeleton background only — no carousel, FAQ/CTA,
            whale, or production home flip.
          </p>
        </div>
      </header>

      <div
        className="mx-auto flex w-full max-w-5xl flex-col"
        data-hero-art-harness-stack=""
      >
        <section
          aria-label="Hero chrome"
          className="relative"
          data-hero-art-harness-section="hero"
        >
          <HeroSection />
          <div data-hero-art-harness-torn-edge="after-hero">
            <TornEdge className="relative z-10 -mt-2" placement="bottom" />
          </div>
        </section>

        <section
          aria-label="Capabilities"
          className="px-4 py-10 sm:px-6 sm:py-12"
          data-hero-art-harness-section="capability"
        >
          <CapabilityStrip />
        </section>

        <section
          aria-label="Youi showcase"
          className="relative pb-16"
          data-hero-art-harness-section="youi"
        >
          <div data-hero-art-harness-torn-edge="before-youi">
            <TornEdge className="relative z-10 mb-2" placement="top" />
          </div>
          <YouiShowcase className="px-4 sm:px-6" />
        </section>
      </div>
    </main>
  );
}
