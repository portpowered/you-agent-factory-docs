/**
 * Tts-owned page MDX component map for packaged-factories-index/tts.
 *
 * Literal-imported by the route-family loader so this route resolves the
 * tts-only replay mount instead of the shared replay-page placeholder.
 * Keep recording imports inside TtsFactoryReplay — never pull sibling
 * packaged-factory recordings into this map module.
 */
import { TtsFactoryReplay } from "./TtsFactoryReplay";

export const pageMdxComponents = {
  TtsFactoryReplay,
};
