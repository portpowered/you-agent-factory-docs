"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";
import { type ComponentProps, useState } from "react";
import {
  docsChromeSearchGlobeGitHubHoverStyle,
  docsChromeSearchKbdHoverStyle,
} from "@/features/docs/styles/docs-chrome-search-globe-github";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { cn } from "@/lib/utils";

type SearchTriggerProps = Omit<ComponentProps<"button">, "type"> & {
  messages: UiMessages;
  hideIfDisabled?: boolean;
};

export function SearchTrigger({
  messages,
  hideIfDisabled,
  className,
  ...props
}: SearchTriggerProps) {
  const { setOpenSearch, enabled, hotKey } = useSearchContext();
  const [hovered, setHovered] = useState(false);

  if (hideIfDisabled && !enabled) {
    return null;
  }

  return (
    <button
      type="button"
      data-search=""
      aria-label={messages.search.open}
      onClick={() => setOpenSearch(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        // Hover/active fill is owned by globals.css + locked --docs-chrome-*
        // tokens (primary yellow). Keep Tailwind primary classes as a backup.
        "hover:!border-[var(--docs-chrome-primary-yellow)] hover:!bg-[var(--docs-chrome-primary-yellow)] hover:text-primary-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "group inline-flex h-9 items-center gap-2 rounded-lg !border !border-border !bg-background !px-2 !py-1.5 text-sm text-muted-foreground transition-colors",
        className,
      )}
      style={docsChromeSearchGlobeGitHubHoverStyle(hovered)}
      {...props}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span>{messages.search.shortcut}</span>
      <span className="ms-1 hidden gap-0.5 md:inline-flex">
        {hotKey.map((key) => (
          <kbd
            key={String(key.display)}
            className={[
              "rounded-md border border-border bg-background px-1.5 text-xs text-foreground",
              "group-hover:border-primary-foreground/25 group-hover:bg-primary-foreground/10 group-hover:text-primary-foreground",
              "group-focus-visible:border-primary-foreground/25 group-focus-visible:bg-primary-foreground/10 group-focus-visible:text-primary-foreground",
            ].join(" ")}
            style={docsChromeSearchKbdHoverStyle(hovered)}
          >
            {key.display}
          </kbd>
        ))}
      </span>
    </button>
  );
}
