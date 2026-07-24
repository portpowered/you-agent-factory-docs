/**
 * Quorum-owned page MDX component map for packaged-factories-index/quorum.
 *
 * Literal-imported by the route-family loader so this route resolves the
 * quorum-only replay mount instead of the shared replay-page placeholder.
 * Keep recording imports inside QuorumFactoryReplay — never pull sibling
 * packaged-factory recordings into this map module.
 */
import { QuorumFactoryReplay } from "./QuorumFactoryReplay";

export const pageMdxComponents = {
  QuorumFactoryReplay,
};
