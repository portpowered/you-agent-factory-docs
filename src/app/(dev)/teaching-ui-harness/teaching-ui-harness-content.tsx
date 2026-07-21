import {
  focusFill,
  mutedFill,
  resolveFocusColor,
} from "@/features/teaching-ui";
import { TeachingUiHarnessTablesSection } from "./teaching-ui-harness-tables-section";

/**
 * Presentational body for `(dev)/teaching-ui-harness`.
 * Kept free of Next.js routing so unit tests can render it directly.
 * Table section is filled by W-table; Chart / List stay placeholders.
 */

const FOCUS_DEMO_ID = "primary-series";
const SAMPLE_IDS = ["primary-series", "secondary-series"] as const;

function RecipeFamilyPlaceholder({
  family,
  description,
}: {
  family: "Chart" | "List";
  description: string;
}) {
  return (
    <section
      aria-labelledby={`teaching-ui-harness-${family.toLowerCase()}-heading`}
      className="space-y-3 rounded-md border border-dashed border-border p-4"
      data-teaching-ui-harness-section={family.toLowerCase()}
    >
      <h2
        className="text-lg font-medium"
        id={`teaching-ui-harness-${family.toLowerCase()}-heading`}
      >
        {family}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div
        aria-hidden="true"
        className="flex min-h-24 items-center justify-center rounded-md bg-muted/40 text-sm text-muted-foreground"
        data-testid={`teaching-ui-harness-${family.toLowerCase()}-placeholder`}
      >
        {family} recipe placeholder (reserved for sibling lane)
      </div>
    </section>
  );
}

function FocusDemo() {
  return (
    <section
      aria-labelledby="teaching-ui-harness-focus-heading"
      className="space-y-3"
      data-teaching-ui-harness-section="focus"
    >
      <h2
        className="text-lg font-medium"
        id="teaching-ui-harness-focus-heading"
      >
        Focus demo
      </h2>
      <p className="text-sm text-muted-foreground">
        Accent vs muted using public{" "}
        <code className="text-xs">@/features/teaching-ui</code> helpers (
        <code className="text-xs">focusId={FOCUS_DEMO_ID}</code>).
      </p>
      <div className="flex flex-wrap gap-4">
        {SAMPLE_IDS.map((id) => {
          const color = resolveFocusColor(id, FOCUS_DEMO_ID, {
            accent: focusFill,
            muted: mutedFill,
          });
          const isFocused = id === FOCUS_DEMO_ID;
          return (
            <div
              className="flex items-center gap-2"
              data-testid={`teaching-ui-harness-focus-swatch-${id}`}
              key={id}
            >
              <span
                aria-hidden="true"
                className="inline-block size-8 rounded-md border border-border"
                data-focus-state={isFocused ? "accent" : "muted"}
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">
                {id}
                {isFocused ? " (accent)" : " (muted)"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TeachingUiHarnessContent() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 bg-background px-6 py-10 text-foreground"
      data-teaching-ui-harness=""
      data-testid="teaching-ui-harness"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Teaching UI harness
        </h1>
        <p className="text-sm text-muted-foreground">
          Chassis shell for Graph-pages recipe families. Chart / List bodies
          land in sibling lanes; Table section ships W-table fixtures; focus
          tokens are proven here.
        </p>
      </header>

      <FocusDemo />

      <RecipeFamilyPlaceholder
        description="Reserved for ComparativeBarChart / ComparativeLineChart."
        family="Chart"
      />
      <RecipeFamilyPlaceholder
        description="Reserved for TeachingList (plain + tagged variants)."
        family="List"
      />
      <TeachingUiHarnessTablesSection />
    </main>
  );
}
