/**
 * Server-rendered Packaged Factory Reference index.
 *
 * Statically consumes the Batch 2 generated ordered corpus and renders each
 * entry’s identity, packaged description, published/schema metadata, stable
 * child link, and unabridged definition panel. Replay, recording, visualizer,
 * and playback modules must never be imported here.
 */

import Link from "next/link";
import { CodePanel } from "@/features/factory-ui/data-display";
import { cn } from "@/lib/utils";
import generatedIndex from "./generated/index.json";
import {
  type PackagedFactoryIndexCorpusLike,
  type PackagedFactoryIndexView,
  type PackagedFactoryIndexViewEntry,
  projectPackagedFactoriesIndex,
} from "./project-packaged-factories-index";

export type PackagedFactoriesIndexProps = {
  /**
   * Optional corpus override for page-local empty/error/JS-only proofs.
   * Production MDX omits this and uses the committed generated index.
   */
  corpus?: PackagedFactoryIndexCorpusLike;
  className?: string;
  "data-testid"?: string;
};

function descriptionText(description: string | null): string {
  if (description === null || description.trim().length === 0) {
    return "No packaged description.";
  }
  return description;
}

function DefinitionPanel({ entry }: { entry: PackagedFactoryIndexViewEntry }) {
  const language = entry.kind === "factory-json" ? "json" : "javascript";
  const label =
    entry.kind === "factory-json"
      ? "factory.json"
      : "Packaged JavaScript source";

  return (
    <div
      className="min-w-0 space-y-2"
      data-packaged-factory-definition={entry.kind}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className="font-medium text-foreground text-xs"
          data-packaged-factory-definition-label=""
        >
          {label}
        </span>
        <span className="text-muted-foreground text-xs">{language}</span>
      </div>
      {entry.kind === "javascript-only" ? (
        <p
          className="text-muted-foreground text-sm"
          data-packaged-factory-no-factory-json=""
        >
          This entry has no factory.json. The panel below shows the complete raw
          packaged JavaScript exactly as acquired.
        </p>
      ) : null}
      <CodePanel
        data-packaged-factory-definition-code=""
        data-testid={`packaged-factory-definition-${entry.childSlug}`}
        maxHeight="lg"
        padding="default"
        surface="low"
      >
        {entry.definitionText}
      </CodePanel>
    </div>
  );
}

function PackagedFactoryIndexEntryView({
  entry,
}: {
  entry: PackagedFactoryIndexViewEntry;
}) {
  const headingId = `${entry.anchorId}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="min-w-0 space-y-3 border-border border-b pb-8 last:border-b-0 last:pb-0"
      data-packaged-factory-entry={entry.childSlug}
      data-packaged-factory-entry-kind={entry.kind}
      id={entry.anchorId}
    >
      <header className="min-w-0 space-y-2">
        <h3
          className="min-w-0 font-semibold text-foreground text-base"
          data-packaged-factory-canonical-name=""
          id={headingId}
        >
          {entry.canonicalName}
        </h3>
        <p
          className="text-muted-foreground text-sm"
          data-packaged-factory-description=""
        >
          {descriptionText(entry.packagedDescription)}
        </p>
        <dl
          className="grid min-w-0 gap-1 text-muted-foreground text-xs sm:grid-cols-2"
          data-packaged-factory-metadata=""
        >
          <div className="min-w-0">
            <dt className="inline font-medium text-foreground">
              Package version
            </dt>
            {": "}
            <dd className="inline" data-packaged-factory-package-version="">
              {entry.packageVersion}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="inline font-medium text-foreground">Source kind</dt>
            {": "}
            <dd className="inline" data-packaged-factory-source-kind="">
              {entry.sourceKind}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="inline font-medium text-foreground">Source path</dt>
            {": "}
            <dd
              className="inline break-all"
              data-packaged-factory-source-path=""
            >
              {entry.sourceRelativePath}
            </dd>
          </div>
        </dl>
        <p className="text-sm">
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-packaged-factory-child-link=""
            href={entry.childHref}
          >
            Open {entry.childSlug} reference
          </Link>
        </p>
      </header>
      <DefinitionPanel entry={entry} />
    </article>
  );
}

function resolveView(
  corpus: PackagedFactoryIndexCorpusLike | undefined,
): PackagedFactoryIndexView {
  return projectPackagedFactoriesIndex(
    corpus ?? (generatedIndex as PackagedFactoryIndexCorpusLike),
  );
}

export function PackagedFactoriesIndex({
  corpus,
  className,
  "data-testid": testId = "packaged-factories-index",
}: PackagedFactoriesIndexProps = {}) {
  const view = resolveView(corpus);

  return (
    <section
      aria-label="Packaged factory enumeration"
      className={cn("min-w-0 space-y-8", className)}
      data-packaged-factories-index=""
      data-packaged-factories-index-package={view.packageName}
      data-packaged-factories-index-version={view.packageVersion}
      data-testid={testId}
    >
      <ol className="m-0 list-none space-y-8 p-0">
        {view.entries.map((entry) => (
          <li key={entry.childSlug}>
            <PackagedFactoryIndexEntryView entry={entry} />
          </li>
        ))}
      </ol>
    </section>
  );
}
