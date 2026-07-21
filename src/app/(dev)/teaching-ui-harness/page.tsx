import { notFound } from "next/navigation";
import { TeachingUiHarnessContent } from "./teaching-ui-harness-content";
import { isTeachingUiHarnessEnabled } from "./teaching-ui-harness-gate";

/**
 * Non-production teaching-ui chassis harness (Graph-pages W-recipes shell).
 *
 * Focus demo + Chart / List placeholders from chassis; Table section filled by
 * W-table fixtures. Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 */
export default function TeachingUiHarnessPage() {
  if (!isTeachingUiHarnessEnabled(process.env)) {
    notFound();
  }

  return <TeachingUiHarnessContent />;
}
