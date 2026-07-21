/**
 * Page-local MDX components for techniques/planner-executor-in-action.
 * Merged by technique-page-load when this file is present next to page.mdx.
 * Do not register these in the shared module MDX map.
 */
import { CompareChartSlot } from "./CompareChartSlot";
import { PatternListTeachingList } from "./PatternListTeachingList";
import { PlaygroundSlot } from "./PlaygroundSlot";

export const pageMdxComponents = {
  PatternListTeachingList,
  PlaygroundSlot,
  CompareChartSlot,
};
