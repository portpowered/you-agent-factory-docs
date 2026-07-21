import { notFound } from "next/navigation";
import { LandingPage } from "@/features/landing-page/LandingPage";

/**
 * Non-production Homepage-2 landing chassis harness.
 *
 * Renders default LandingPage placeholders so reviewers can scroll the full
 * vertical rhythm and confirm theme CSS variables on the root wrapper.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 * Does not flip production `/` (W-integrate).
 */
export default function LandingHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <LandingPage />;
}
