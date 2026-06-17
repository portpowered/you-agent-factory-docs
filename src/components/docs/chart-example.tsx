import { DocsLineChart } from "@/components/docs/primitives";
import {
  CHART_EXAMPLE_INTRO,
  CHART_EXAMPLE_TITLE,
  type DocsChartConfig,
  LINE_CHART_SECTION_DESCRIPTION,
  LINE_CHART_SECTION_HEADING,
} from "@/lib/docs-charts";

type QueueDepthDatum = {
  hour: string;
  completedReviews: number;
  reviewReadyFindings: number;
};

const LINE_CHART_DATA: QueueDepthDatum[] = [
  { hour: "09:00", completedReviews: 42, reviewReadyFindings: 30 },
  { hour: "10:00", completedReviews: 58, reviewReadyFindings: 44 },
  { hour: "11:00", completedReviews: 76, reviewReadyFindings: 59 },
  { hour: "12:00", completedReviews: 88, reviewReadyFindings: 71 },
  { hour: "13:00", completedReviews: 104, reviewReadyFindings: 86 },
  { hour: "14:00", completedReviews: 121, reviewReadyFindings: 102 },
];

const LINE_CHART_CONFIG: DocsChartConfig<QueueDepthDatum> = {
  title: "Review throughput by hour",
  description:
    "Completed review passes and review-ready findings during one docs-factory workday.",
  categoryKey: "hour",
  categoryLabel: "Hour",
  summary:
    "From 09:00 to 14:00 UTC, completed review passes rise from 42 to 121 while review-ready findings rise from 30 to 102.",
  series: [
    {
      key: "completedReviews",
      label: "Completed review passes",
      color: "#0f766e",
    },
    {
      key: "reviewReadyFindings",
      label: "Review-ready findings",
      color: "#c2410c",
    },
  ],
};

export function ChartExample() {
  return (
    <article aria-labelledby="chart-example-title">
      <h1 id="chart-example-title">{CHART_EXAMPLE_TITLE}</h1>
      <p className="docs-shell__framing">{CHART_EXAMPLE_INTRO}</p>

      <section aria-labelledby="line-chart-section-heading">
        <h2 id="line-chart-section-heading">{LINE_CHART_SECTION_HEADING}</h2>
        <p className="docs-shell__framing">{LINE_CHART_SECTION_DESCRIPTION}</p>
        <DocsLineChart config={LINE_CHART_CONFIG} data={LINE_CHART_DATA} />
      </section>
    </article>
  );
}
