/**
 * Goal-owned page MDX component map for packaged-factories-index/goal.
 *
 * Literal-imported by the route-family loader so this route resolves the
 * goal-only replay mount instead of the shared replay-page placeholder.
 * Keep recording imports inside GoalFactoryReplay — never pull sibling
 * packaged-factory recordings into this map module.
 */
import { GoalFactoryReplay } from "./GoalFactoryReplay";

export const pageMdxComponents = {
  GoalFactoryReplay,
};
