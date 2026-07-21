import { notFound } from "next/navigation";
import { HeroArtHarnessView } from "./hero-art-harness-view";

/**
 * Non-production W-hero-art harness.
 *
 * Stacks owned art sections (HeroSection chrome, CapabilityStrip, YouiShowcase)
 * with TornEdge in two places on a neutral/skeleton background.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 * Does not flip production `/` or touch HY-home.
 */
export default function HeroArtHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <HeroArtHarnessView />;
}
