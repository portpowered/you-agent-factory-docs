import { notFound } from "next/navigation";
import { LandingPage } from "@/features/landing-page/LandingPage";
import {
  composeWaveAFooterSlot,
  composeWaveAWhaleBubblesSlot,
} from "./compose-wave-a-slots";

/**
 * Non-production Homepage-2 landing chassis harness.
 *
 * Wave A fill (incremental): real SiteFooter + WhaleBubblesSection; remaining
 * slots stay labeled placeholders until later integrate stories. Hidden in
 * production unless ENABLE_COMPONENT_EXAMPLES=1. Does not flip production `/`.
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
      footer={composeWaveAFooterSlot()}
      whaleBubbles={composeWaveAWhaleBubblesSlot()}
    />
  );
}
