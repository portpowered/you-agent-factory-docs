import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogNextPostNeighbor } from "@/lib/content/blog-next-post";

type BlogNextPostControlProps = {
  next: BlogNextPostNeighbor;
};

/**
 * Compact next-post footer control for published blog posts.
 * Renders only when a next neighbor exists — callers omit the control otherwise.
 */
export function BlogNextPostControl({ next }: BlogNextPostControlProps) {
  return (
    <nav
      aria-label="Next blog post"
      className="not-prose mt-10 border-t border-border pt-6"
      data-testid="blog-next-post"
    >
      <Link
        href={next.href}
        className="group inline-flex max-w-full items-center gap-2 text-sm text-foreground no-underline transition-colors hover:text-primary hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="blog-next-post-link"
      >
        <span className="text-muted-foreground">Next post</span>
        <span className="truncate font-medium">{next.title}</span>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary"
          aria-hidden
        />
      </Link>
    </nav>
  );
}
