/**
 * Public barrel for teaching-ui lists (graph-pages W-lists).
 *
 * Top-level `teaching-ui/index.ts` is W-recipes territory — consumers may
 * import `@/features/teaching-ui/lists` directly until that chassis re-exports.
 */

export { TeachingList } from "./TeachingList";
export type {
  TeachingListItem,
  TeachingListProps,
  TeachingListVariant,
} from "./teaching-list.types";
