import { notFound } from "next/navigation";
import { isSphereHarnessEnabled } from "./sphere-harness-gate";
import { SphereHarnessView } from "./sphere-harness-view";

/**
 * Non-production W-sphere harness.
 *
 * Sphere only — no whale, carousel, hero art, FAQ, or footer chrome.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 */
export default function SphereHarnessPage() {
  if (!isSphereHarnessEnabled(process.env)) {
    notFound();
  }

  return <SphereHarnessView />;
}
