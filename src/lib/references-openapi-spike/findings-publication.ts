/**
 * W01 OpenAPI spike — findings publication inventory + production unpin policy.
 *
 * Planner-facing narrative also lives under gitignored `docs/temp/references/`.
 * The committed rollup at `findings-rollup.md` (next to this module) is the
 * CI-checkable source of truth so PR checks do not depend on gitignored files.
 */

import {
  SPIKE_ROUTE_PATH,
  SPIKE_SEARCH_PROJECTION_POLICY,
} from "./cost-measurements";
import { OPENAPI_SPIKE_STATUS } from "./dependency-selection";

/**
 * Committed consolidated findings rollup (CI / PR review).
 * Keep in sync with the planner copy under `docs/temp/references/`.
 */
export const OPENAPI_SPIKE_FINDINGS_ROLLUP_COMMITTED_PATH =
  "src/lib/references-openapi-spike/findings-rollup.md" as const;

/** Planner-facing findings document (gitignored local state). */
export const OPENAPI_SPIKE_FINDINGS_ROLLUP_PATH =
  "docs/temp/references/w01-openapi-spike-findings.md" as const;

/** Per-story narrative findings that the rollup summarizes (planner copies). */
export const OPENAPI_SPIKE_FINDINGS_SOURCES = [
  {
    storyId: "refs-w01-openapi-single-page-spike-001",
    topic: "dependency-choice-and-upgrade-risk",
    path: "docs/temp/references/w01-openapi-dependency-findings.md",
  },
  {
    storyId: "refs-w01-openapi-single-page-spike-002",
    topic: "single-page-render",
    path: "docs/temp/references/w01-openapi-single-page-route-findings.md",
  },
  {
    storyId: "refs-w01-openapi-single-page-spike-003",
    topic: "anchors-schemas-examples",
    path: "docs/temp/references/w01-openapi-anchors-schemas-examples-findings.md",
  },
  {
    storyId: "refs-w01-openapi-single-page-spike-004",
    topic: "playground-suppression",
    path: "docs/temp/references/w01-openapi-playground-suppression-findings.md",
  },
  {
    storyId: "refs-w01-openapi-single-page-spike-005",
    topic: "theme-customization",
    path: "docs/temp/references/w01-openapi-theme-customization-findings.md",
  },
  {
    storyId: "refs-w01-openapi-single-page-spike-006",
    topic: "mobile-navigation-and-costs",
    path: "docs/temp/references/w01-openapi-mobile-and-costs-findings.md",
  },
] as const;

/** Topics the consolidated rollup must record (acceptance checklist). */
export const OPENAPI_SPIKE_FINDINGS_REQUIRED_TOPICS = [
  "dependency-choice",
  "upgrade-candidate-and-risk",
  "single-page-render-result",
  "anchor-collision-result",
  "playground-suppression",
  "customization-results",
  "mobile-navigation-notes",
  "cost-measurements",
] as const;

export type OpenApiSpikeFindingsRequiredTopic =
  (typeof OPENAPI_SPIKE_FINDINGS_REQUIRED_TOPICS)[number];

/**
 * Production unpin / non-merge policy for W01.
 *
 * Temporary `package.json` pins for `fumadocs-openapi` / Scalar are allowed as
 * spike evidence only. They are not the final production OpenAPI dependency
 * set — W08 chooses after W01/W02 evidence is used.
 */
export const OPENAPI_SPIKE_PUBLICATION_POLICY = {
  status: OPENAPI_SPIKE_STATUS,
  spikeRoutePath: SPIKE_ROUTE_PATH,
  shippedReferencesApiSurface: "/docs/references/api",
  isShippedReferencesApiSurface: false,
  openApiDependencyPinStatus: "temporary-non-final" as const,
  finalProductionOpenApiVersionsPinned: false,
  ownsW02AsyncApiProjector: false,
  editsSharedNavigationInventory: false,
  editsSharedSearchInventory:
    SPIKE_SEARCH_PROJECTION_POLICY.includedInSharedSearchInventory,
  editsSharedSitemapInventory:
    SPIKE_SEARCH_PROJECTION_POLICY.includedInSharedSitemapInventory,
  expectedSearchProjectionDeltaBytes:
    SPIKE_SEARCH_PROJECTION_POLICY.expectedSearchProjectionDeltaBytes,
  findingsDirectory: "docs/temp/references",
  findingsRollupPath: OPENAPI_SPIKE_FINDINGS_ROLLUP_PATH,
  findingsRollupCommittedPath: OPENAPI_SPIKE_FINDINGS_ROLLUP_COMMITTED_PATH,
} as const;

/** Headings the rollup must include so planners can locate each topic. */
export const OPENAPI_SPIKE_FINDINGS_ROLLUP_REQUIRED_HEADINGS = [
  "## Dependency choice",
  "## Upgrade candidate and risk",
  "## Single-page render result",
  "## Anchor collision result",
  "## Playground suppression",
  "## Customization results",
  "## Mobile navigation notes",
  "## Cost measurements",
  "## Production unpin and out-of-scope",
] as const;

/**
 * Assert the rollup markdown covers every required heading and non-production
 * markers. Pure string checks — filesystem IO belongs in the test/harness.
 */
export function assertFindingsRollupContent(markdown: string): string[] {
  const failures: string[] = [];

  if (!/non-production/i.test(markdown)) {
    failures.push("Rollup must mark the spike as non-production.");
  }
  if (!markdown.includes("/docs/references/api")) {
    failures.push(
      "Rollup must state the spike is not the shipped /docs/references/api surface.",
    );
  }
  if (
    !/temporary/i.test(markdown) ||
    !(
      /non-final/i.test(markdown) ||
      /not the final/i.test(markdown) ||
      /remain unpinned/i.test(markdown) ||
      /stay unpinned/i.test(markdown)
    )
  ) {
    failures.push(
      "Rollup must record that OpenAPI dependency pins remain temporary / non-final.",
    );
  }
  if (!/W02/i.test(markdown) || !/AsyncAPI/i.test(markdown)) {
    failures.push(
      "Rollup must record that this lane does not own W02 AsyncAPI projector work.",
    );
  }
  if (!/nav(igation)?|search|sitemap/i.test(markdown)) {
    failures.push(
      "Rollup must record that shared nav/search/sitemap inventories were not edited.",
    );
  }

  for (const heading of OPENAPI_SPIKE_FINDINGS_ROLLUP_REQUIRED_HEADINGS) {
    if (!markdown.includes(heading)) {
      failures.push(`Rollup missing required heading: ${heading}`);
    }
  }

  return failures;
}
