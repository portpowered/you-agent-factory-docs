import { cn } from "@/lib/utils";
import type { TeachingListProps } from "./teaching-list.types";

const EMPTY_STATUS_COPY = "No items.";

/**
 * Plain or tagged teaching list for pattern bullets and reading notes.
 *
 * Flat presentation by default (no card chrome). Required `listLabel` is the
 * list accessible name. Empty `items` yields an accessible status region.
 */
export function TeachingList({
  items,
  variant = "plain",
  listLabel,
  className,
}: TeachingListProps) {
  const showTags = variant === "tagged";

  if (items.length === 0) {
    return (
      <div
        className={cn("teaching-list", className)}
        data-testid="teaching-list"
      >
        <ul aria-label={listLabel} className="sr-only" data-empty="true" />
        <p className="text-sm text-muted-foreground" role="status">
          {EMPTY_STATUS_COPY}
        </p>
      </div>
    );
  }

  return (
    <ul
      aria-label={listLabel}
      className={cn("teaching-list flex flex-col gap-3", className)}
      data-testid="teaching-list"
      data-variant={variant}
    >
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {item.title}
          </span>
          {item.description != null && item.description.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {item.description}
            </span>
          ) : null}
          {showTags && item.tags != null && item.tags.length > 0 ? (
            <ul
              aria-label={`${item.title} tags`}
              className="mt-0.5 flex flex-wrap gap-1.5"
            >
              {item.tags.map((tag) => (
                <li key={`${item.id}:${tag}`}>
                  <span className="text-xs text-muted-foreground">{tag}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
