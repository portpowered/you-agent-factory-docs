import { notFound } from "next/navigation";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { composeWaveALandingHarnessSlots } from "./compose-wave-a-slots";
import { composeWaveBLandingHarnessSlots } from "./compose-wave-b-slots";

/**
 * Non-production Homepage-2 landing chassis harness.
 *
 * Wave A + incremental Wave B fills: wired slots receive fixture-mapped
 * fills (SiteFooter, WhaleBubblesSection, ParticleSphere + optional Terminal,
 * FactoryCarousel, FaqPanel, CtaBand). Remaining unwired slots stay labeled
 * placeholders via LandingPage defaults. Hidden in production unless
 * ENABLE_COMPONENT_EXAMPLES=1. Does not flip production `/`.
 */
export default function LandingHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return (
    <LandingPage
      {...composeWaveALandingHarnessSlots()}
      {...composeWaveBLandingHarnessSlots()}
    />
  );
}
