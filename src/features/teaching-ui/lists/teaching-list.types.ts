/**
 * Locked graph-pages TeachingList item / props contract (W-lists).
 *
 * Do not invent richer tag objects or emptyMessage props here — Wave B pages
 * pass display strings only.
 */

export type TeachingListItem = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
};

export type TeachingListVariant = "plain" | "tagged";

export type TeachingListProps = {
  items: TeachingListItem[];
  variant?: TeachingListVariant;
  listLabel: string;
  className?: string;
};
