import { notFound } from "next/navigation";
import { isTeachingUiHarnessEnabled } from "./teaching-ui-harness-gate";
import { TeachingUiHarnessView } from "./teaching-ui-harness-view";

/**
 * Non-production teaching-ui harness.
 *
 * Table section ships fixture orchestrators for W-table. Chart / list sections
 * are placeholders for sibling lanes. Hidden in production unless
 * ENABLE_COMPONENT_EXAMPLES=1.
 */
export default function TeachingUiHarnessPage() {
  if (!isTeachingUiHarnessEnabled(process.env)) {
    notFound();
  }

  return <TeachingUiHarnessView />;
}
