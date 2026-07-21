import { notFound } from "next/navigation";
import {
  TeachingList,
  type TeachingListItem,
} from "@/features/teaching-ui/lists";

/**
 * Non-production TeachingList harness (graph-pages W-lists).
 *
 * Plain + tagged fixtures only — no charts, tables, registries, or production
 * page mounts. Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 */

const plainFixtureItems: TeachingListItem[] = [
  {
    id: "pattern-loop",
    title: "Loop until done",
    description: "Repeat the agent step until the goal is met.",
  },
  {
    id: "pattern-review",
    title: "Writer then reviewer",
    description: "Separate drafting from checking before merge.",
  },
  {
    id: "pattern-worktree",
    title: "Isolate with worktrees",
  },
];

const taggedFixtureItems: TeachingListItem[] = [
  {
    id: "note-harness",
    title: "Harness keeps work alive",
    description: "Long-running agent work stays persistent.",
    tags: ["harness", "persistence"],
  },
  {
    id: "note-compaction",
    title: "Compaction preserves signal",
    tags: ["context", "memory"],
  },
  {
    id: "note-ralph",
    title: "Ralph loops on a PRD",
    description: "One story per iteration until passes is true.",
    tags: ["ralph", "prd"],
  },
];

export default function TeachingUiListsHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 bg-background px-6 py-10 text-foreground"
      data-testid="teaching-ui-lists-harness"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          TeachingList harness
        </h1>
        <p className="text-sm text-muted-foreground">
          Fixture surface for plain and tagged TeachingList variants. Not linked
          from production navigation.
        </p>
      </header>

      <section
        className="space-y-3"
        data-testid="teaching-ui-lists-harness-plain"
      >
        <h2 className="text-lg font-medium">Plain list</h2>
        <TeachingList items={plainFixtureItems} listLabel="Pattern bullets" />
      </section>

      <section
        className="space-y-3"
        data-testid="teaching-ui-lists-harness-tagged"
      >
        <h2 className="text-lg font-medium">Tagged list</h2>
        <TeachingList
          items={taggedFixtureItems}
          listLabel="Reading notes"
          variant="tagged"
        />
      </section>
    </main>
  );
}
