import { notFound } from "next/navigation";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { composeWaveALandingHarnessSlots } from "./compose-wave-a-slots";

/**
 * Non-production Homepage-2 landing chassis harness.
 *
 * Wave A fill (incremental): only wired slots receive fixture-mapped fills
 * (SiteFooter, WhaleBubblesSection, ParticleSphere + optional Terminal).
 * Unwired Wave B slots stay labeled placeholders via LandingPage defaults.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1. Does not flip
 * production `/`.
 */
export default function LandingHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <LandingPage {...composeWaveALandingHarnessSlots()} />;
}
