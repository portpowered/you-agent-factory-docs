/**
 * Subagent-owned page MDX component map for packaged-factories-index/subagent.
 *
 * Literal-imported by the route-family loader so this route resolves the
 * subagent-only replay mount instead of the shared replay-page placeholder.
 * Keep recording imports inside SubagentFactoryReplay — never pull sibling
 * packaged-factory recordings into this map module.
 */
import { SubagentFactoryReplay } from "./SubagentFactoryReplay";

export const pageMdxComponents = {
  SubagentFactoryReplay,
};
