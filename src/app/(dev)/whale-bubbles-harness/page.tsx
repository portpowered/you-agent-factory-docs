import { notFound } from "next/navigation";
import { WhaleBubblesHarness } from "@/features/landing-page/components/WhaleBubblesHarness";

/**
 * Non-production W-whale-bubbles harness.
 *
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1 (same gate as
 * other `(dev)` component harnesses). Does not touch production `/`.
 */
export default function WhaleBubblesHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <WhaleBubblesHarness />;
}
