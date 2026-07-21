import { notFound } from "next/navigation";
import { TeachingUiHarnessContent } from "./teaching-ui-harness-content";

/**
 * Non-production teaching-ui chassis harness (Graph-pages W-recipes).
 *
 * Labeled Chart / List / Table placeholders + focus accent vs muted demo.
 * Does not implement ComparativeBar/Line, TeachingList, or
 * FilterableSortableTable — those belong to sibling lanes.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 */
export default function TeachingUiHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return <TeachingUiHarnessContent />;
}
