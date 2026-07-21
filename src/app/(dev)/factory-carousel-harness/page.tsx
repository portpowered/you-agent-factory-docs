import { notFound } from "next/navigation";
import { isFactoryCarouselHarnessEnabled } from "./factory-carousel-harness-gate";
import { FactoryCarouselHarnessView } from "./factory-carousel-harness-view";

/**
 * Non-production W-carousel harness (homepage-2 Wave B).
 *
 * FactoryCarousel alone on a neutral background with fixture slides.
 * No hero art, FAQ, CTA, header, whale, sphere, or footer chrome.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 * Does not flip production `/` or rewrite LandingPage slot wiring.
 */
export default function FactoryCarouselHarnessPage() {
  if (!isFactoryCarouselHarnessEnabled(process.env)) {
    notFound();
  }

  return <FactoryCarouselHarnessView />;
}
