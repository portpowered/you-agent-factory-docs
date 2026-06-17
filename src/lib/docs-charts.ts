import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";

export type DocsChartDatum = Record<string, number | string | null>;

export type DocsChartSeriesConfig<TData extends DocsChartDatum> = {
  key: keyof TData & string;
  label: string;
  color: string;
};

export type DocsChartConfig<TData extends DocsChartDatum> = {
  title: string;
  description?: string;
  categoryKey: keyof TData & string;
  categoryLabel: string;
  series: readonly DocsChartSeriesConfig<TData>[];
  summary?: string;
};

function formatPointCount(count: number): string {
  return `${count} data point${count === 1 ? "" : "s"}`;
}

export const CHART_EXAMPLE_ROUTE = "/docs/examples/charts";

export const CHART_EXAMPLE_CANONICAL_ID = "doc/examples/charts";

export const CHART_EXAMPLE_SECTION_ID = "examples";

export const CHART_EXAMPLE_SECTION_LABEL = "Examples";

export const DOCS_NAV_CHART_EXAMPLE_LABEL = "Charts";

export const CHART_EXAMPLE_TITLE = "Docs chart examples";

export const CHART_EXAMPLE_INTRO =
  "Reviewer-visible examples of the reusable docs chart wrappers with explicit authored data, accessible summaries, and responsive overflow behavior.";

export const LINE_CHART_SECTION_HEADING = "Line chart";

export const LINE_CHART_SECTION_DESCRIPTION =
  "This representative line chart keeps authored data and labels in checked-in source while the wrapper owns responsive sizing, reduced-motion handling, and screen-reader summary treatment.";

/** Appends the reviewer-visible chart example route to docs navigation. */
export function withChartExampleNavigation(
  navigation: DocsShellNavigationInput,
): DocsShellNavigationInput {
  const existingSection = navigation.sections.find(
    (section) => section.id === CHART_EXAMPLE_SECTION_ID,
  );

  const examplePage = {
    canonicalId: CHART_EXAMPLE_CANONICAL_ID,
    label: DOCS_NAV_CHART_EXAMPLE_LABEL,
    href: CHART_EXAMPLE_ROUTE,
    order: 2,
  };

  if (existingSection) {
    return {
      ...navigation,
      sections: navigation.sections.map((section) =>
        section.id === CHART_EXAMPLE_SECTION_ID
          ? {
              ...section,
              pages: section.pages.some(
                (page) => page.canonicalId === examplePage.canonicalId,
              )
                ? section.pages
                : [...section.pages, examplePage].sort(
                    (left, right) =>
                      (left.order ?? Number.MAX_SAFE_INTEGER) -
                      (right.order ?? Number.MAX_SAFE_INTEGER),
                  ),
            }
          : section,
      ),
    };
  }

  return {
    ...navigation,
    sections: [
      ...navigation.sections,
      {
        id: CHART_EXAMPLE_SECTION_ID,
        label: CHART_EXAMPLE_SECTION_LABEL,
        pages: [examplePage],
      },
    ],
  };
}

/** Builds a reviewer-visible summary from authored chart inputs when none is supplied. */
export function formatDocsChartSummary<TData extends DocsChartDatum>(
  config: DocsChartConfig<TData>,
  data: readonly TData[],
): string {
  if (config.summary) {
    return config.summary;
  }

  const seriesLabels = config.series.map((series) => series.label).join(", ");

  return `${formatPointCount(data.length)} across ${config.categoryLabel}. Series: ${seriesLabels}.`;
}
