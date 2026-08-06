/**
 * Derives explorer sidebar grouping from registry records.
 *
 * Grouping used to live in three hand-maintained per-slug maps inside
 * `sidebar-grouping.ts`; adding a page meant editing a map that sat far away
 * from the page itself. The record now declares its own placement in
 * `sidebarGrouping`, and this module projects those declarations into the
 * slug-keyed lookups the explorer adapters consume.
 *
 * Keys are *explorer lookup slugs*, not record slugs: Program membership strips
 * a leading `documentation/` and Reference membership strips a leading
 * `references/`, so cross-collection placements (a Program page surfaced under
 * Reference → Limits) stay addressable. That normalization is applied here so
 * callers keep passing the same keys they always did.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type SidebarGroupingRecordFields = {
  concepts?: string;
  glossary?: string;
  documentation?: string;
  documentationSecondary?: string;
  references?: string;
};

export type SidebarGroupingSourceRecord = {
  id: string;
  slug: string;
  kind: string;
  sidebarGrouping?: SidebarGroupingRecordFields;
};

export type PublishedDocsSlugEntry = {
  registryId: string;
  docsSlug: string;
};

export type DerivedSidebarGrouping = {
  concepts: Record<string, string>;
  documentation: Record<string, { group: string; secondary?: string }>;
  references: Record<string, string>;
};

/** Program membership key: `documentation/` pages collapse to their bare slug. */
export function toDocumentationMembershipKey(docsSlug: string): string {
  return docsSlug.startsWith("documentation/")
    ? docsSlug.slice("documentation/".length)
    : docsSlug;
}

/** Reference membership key: `references/` pages collapse to their bare slug. */
export function toReferenceMembershipKey(docsSlug: string): string {
  return docsSlug.startsWith("references/")
    ? docsSlug.slice("references/".length)
    : docsSlug;
}

/**
 * Projects records + published docs slugs into the three explorer lookups.
 *
 * A record without a published docs entry contributes nothing: unpublished
 * pages must not create explorer ghosts.
 */
export function deriveSidebarGrouping(
  records: readonly SidebarGroupingSourceRecord[],
  publishedEntries: readonly PublishedDocsSlugEntry[],
): DerivedSidebarGrouping {
  const docsSlugById = new Map(
    publishedEntries.map((entry) => [entry.registryId, entry.docsSlug]),
  );

  const derived: DerivedSidebarGrouping = {
    concepts: {},
    documentation: {},
    references: {},
  };

  for (const record of records) {
    const grouping = record.sidebarGrouping;
    if (!grouping) {
      continue;
    }
    const docsSlug = docsSlugById.get(record.id);
    if (docsSlug === undefined) {
      continue;
    }

    if (grouping.concepts) {
      derived.concepts[record.slug] = grouping.concepts;
    }
    if (grouping.documentation) {
      derived.documentation[toDocumentationMembershipKey(docsSlug)] = {
        group: grouping.documentation,
        ...(grouping.documentationSecondary
          ? { secondary: grouping.documentationSecondary }
          : {}),
      };
    }
    if (grouping.references) {
      derived.references[toReferenceMembershipKey(docsSlug)] =
        grouping.references;
    }
  }

  return sortDerivedGrouping(derived);
}

/** Stable key order so generated output does not churn between runs. */
function sortDerivedGrouping(
  derived: DerivedSidebarGrouping,
): DerivedSidebarGrouping {
  const sortEntries = <T>(value: Record<string, T>): Record<string, T> =>
    Object.fromEntries(
      Object.entries(value).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );

  return {
    concepts: sortEntries(derived.concepts),
    documentation: sortEntries(derived.documentation),
    references: sortEntries(derived.references),
  };
}

/** Reads every registry record JSON under `registryRoot`. */
export function readSidebarGroupingSourceRecords(
  registryRoot: string,
): SidebarGroupingSourceRecord[] {
  const records: SidebarGroupingSourceRecord[] = [];

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory).sort()) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.endsWith(".json")) {
        continue;
      }
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "id" in parsed &&
        "slug" in parsed &&
        "kind" in parsed
      ) {
        records.push(parsed as SidebarGroupingSourceRecord);
      }
    }
  };

  walk(registryRoot);
  return records;
}
