/**
 * Public barrel for teaching-ui (Graph-pages Wave A chassis).
 *
 * Consumers import focus tokens/helpers from `@/features/teaching-ui`.
 * Chart / list / table recipe bodies are owned by sibling lanes — do not
 * stub those APIs here.
 */

export {
  DEFAULT_FOCUS_COLOR_TOKENS,
  type FocusColorTokens,
  focusFill,
  mutedFill,
  resolveFocusColor,
} from "./focus";
