import Link from "next/link";
import {
  assertFactoryFooterNeighbors,
  type FactoryFooterNeighbor,
  type FactoryFooterNeighbors,
} from "@/lib/content/factory-prev-next-related";

function FamilyFooterCard({
  item,
  direction,
}: {
  item: FactoryFooterNeighbor;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={item.url}
      className={`flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/80 ${
        isNext ? "text-end" : ""
      }`}
    >
      <div
        className={`inline-flex items-center gap-1.5 font-medium ${
          isNext ? "flex-row-reverse" : ""
        }`}
      >
        <span aria-hidden="true">{isNext ? "→" : "←"}</span>
        <p>{item.name}</p>
      </div>
      <p className="truncate text-muted-foreground">
        {isNext ? "Next page" : "Previous page"}
      </p>
    </Link>
  );
}

/**
 * Family-scoped previous/next cards that do not use Fumadocs `Footer` /
 * `useFooterItems` (those require DocsLayout tree context). Safe for App Router
 * entry unit tests and production DocsPage surfaces with `footer` disabled.
 */
export function FamilyDocsFooterNeighbors({
  neighbors,
}: {
  neighbors: FactoryFooterNeighbors;
}) {
  if (!neighbors.previous && !neighbors.next) {
    return null;
  }

  assertFactoryFooterNeighbors(neighbors);

  return (
    <nav
      aria-label="Page navigation"
      className={`@container mt-8 grid gap-4 ${
        neighbors.previous && neighbors.next ? "grid-cols-2" : "grid-cols-1"
      }`}
      data-testid="family-docs-footer-neighbors"
    >
      {neighbors.previous ? (
        <FamilyFooterCard item={neighbors.previous} direction="previous" />
      ) : null}
      {neighbors.next ? (
        <FamilyFooterCard item={neighbors.next} direction="next" />
      ) : null}
    </nav>
  );
}
