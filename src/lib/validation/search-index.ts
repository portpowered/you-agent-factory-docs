import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type PublicSearchArtifact,
  type PublicSearchArtifactEntry,
  assertStarterContentValid,
  buildLocalizedSearchDocumentId,
  loadPublicSearchArtifact,
  loadStarterContentRecords,
  serializePublicSearchArtifact,
  shouldIncludeVariantInSearch,
} from "@/lib/content";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");
const DEFAULT_ARTIFACT_PATH = join(
  process.cwd(),
  "public/search/public-search-index.json",
);

export type SearchIndexValidationIssue = {
  field: "artifactPath" | "artifact" | "exclusion";
  message: string;
};

export type SearchIndexValidationResult = {
  valid: boolean;
  issues: SearchIndexValidationIssue[];
};

export type SearchIndexValidationOptions = {
  contentRoot?: string;
  artifactPath?: string;
  checkedInArtifactSource?: string;
};

type ExcludedSearchEntry = {
  id: string;
  canonicalId: string;
  kind: string;
  reason: string;
};

function formatArtifactValue(value: unknown): string {
  return JSON.stringify(value);
}

function readCheckedInArtifactSource(
  artifactPath: string,
  overrideSource: string | undefined,
): string | SearchIndexValidationIssue {
  if (typeof overrideSource === "string") {
    return overrideSource;
  }

  if (!existsSync(artifactPath)) {
    return {
      field: "artifactPath",
      message: `Checked-in search artifact is missing at ${artifactPath}. Run bun run generate:search-index and commit public/search/public-search-index.json.`,
    };
  }

  return readFileSync(artifactPath, "utf8");
}

function parseArtifactSource(
  artifactPath: string,
  source: string,
): PublicSearchArtifact | SearchIndexValidationIssue {
  try {
    return JSON.parse(source) as PublicSearchArtifact;
  } catch {
    return {
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} is not valid JSON. Regenerate with bun run generate:search-index and commit public/search/public-search-index.json.`,
    };
  }
}

function describeExclusionReason(entry: {
  record: { status: string; searchInclude: boolean };
}): string {
  if (!entry.record.searchInclude) {
    return "search.include: false";
  }

  return `status: ${entry.record.status}`;
}

function collectExcludedSearchEntries(
  contentRoot: string,
): Map<string, ExcludedSearchEntry> {
  const { failures, variantBindings } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  return new Map(
    variantBindings
      .filter((binding) => !shouldIncludeVariantInSearch(binding))
      .map((binding) => {
        const entry: ExcludedSearchEntry = {
          id: buildLocalizedSearchDocumentId(
            binding.record.id,
            binding.variantLocale,
          ),
          canonicalId: binding.record.id,
          kind: binding.record.kind,
          reason: describeExclusionReason(binding),
        };

        return [entry.id, entry];
      }),
  );
}

function collectExcludedEntryIssues(
  artifact: PublicSearchArtifact,
  excludedEntries: Map<string, ExcludedSearchEntry>,
  sourceLabel: string,
): SearchIndexValidationIssue[] {
  const issues: SearchIndexValidationIssue[] = [];

  for (const artifactEntry of artifact.entries) {
    const excluded = excludedEntries.get(artifactEntry.id);
    if (!excluded) {
      continue;
    }

    issues.push({
      field: "exclusion",
      message: `${sourceLabel} includes excluded ${excluded.kind} entry ${excluded.id} (${excluded.canonicalId}); rule ${excluded.reason} must keep it out of public search data.`,
    });
  }

  return issues;
}

function collectArtifactAlignmentIssues(
  checkedInArtifact: PublicSearchArtifact,
  generatedArtifact: PublicSearchArtifact,
  artifactPath: string,
): SearchIndexValidationIssue[] {
  const issues: SearchIndexValidationIssue[] = [];

  if (checkedInArtifact.version !== generatedArtifact.version) {
    issues.push({
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} uses version ${checkedInArtifact.version}, but generated artifact uses version ${generatedArtifact.version}. This is a normalized search-document contract mismatch.`,
    });
  }

  const checkedInEntriesById = new Map(
    checkedInArtifact.entries.map((entry) => [entry.id, entry] as const),
  );
  const generatedEntriesById = new Map(
    generatedArtifact.entries.map((entry) => [entry.id, entry] as const),
  );

  for (const generatedEntry of generatedArtifact.entries) {
    if (checkedInEntriesById.has(generatedEntry.id)) {
      continue;
    }

    issues.push({
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} is missing generated entry ${generatedEntry.id}. This is deterministic artifact drift from the normalized search documents.`,
    });
  }

  for (const checkedInEntry of checkedInArtifact.entries) {
    if (generatedEntriesById.has(checkedInEntry.id)) {
      continue;
    }

    issues.push({
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} still contains stale entry ${checkedInEntry.id} that is absent from the generated artifact. This is deterministic artifact drift from the normalized search documents.`,
    });
  }

  const comparableEntryCount = Math.min(
    checkedInArtifact.entries.length,
    generatedArtifact.entries.length,
  );

  for (let index = 0; index < comparableEntryCount; index += 1) {
    const checkedInEntry = checkedInArtifact.entries[index];
    const generatedEntry = generatedArtifact.entries[index];
    if (checkedInEntry?.id === generatedEntry?.id) {
      continue;
    }

    issues.push({
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} has unstable ordering at index ${index}: expected ${generatedEntry?.id ?? "<missing>"} but found ${checkedInEntry?.id ?? "<missing>"}. Regenerate with bun run generate:search-index to restore deterministic ordering.`,
    });
    break;
  }

  for (const generatedEntry of generatedArtifact.entries) {
    const checkedInEntry = checkedInEntriesById.get(generatedEntry.id);
    if (!checkedInEntry) {
      continue;
    }

    const mismatch = findEntryFieldMismatch(checkedInEntry, generatedEntry);
    if (!mismatch) {
      continue;
    }

    issues.push({
      field: "artifact",
      message: `Checked-in search artifact at ${artifactPath} has a normalized contract mismatch for entry ${generatedEntry.id}: field ${mismatch.field} expected ${formatArtifactValue(mismatch.expected)} but found ${formatArtifactValue(mismatch.actual)}.`,
    });
  }

  return issues;
}

function findEntryFieldMismatch(
  checkedInEntry: PublicSearchArtifactEntry,
  generatedEntry: PublicSearchArtifactEntry,
): {
  field: keyof PublicSearchArtifactEntry;
  expected: unknown;
  actual: unknown;
} | null {
  const fields: (keyof PublicSearchArtifactEntry)[] = [
    "id",
    "canonicalId",
    "locale",
    "canonicalLocale",
    "availableLocales",
    "kind",
    "url",
    "title",
    "description",
    "headings",
    "body",
    "tags",
    "aliases",
    "section",
    "searchPriority",
  ];

  for (const field of fields) {
    const expected = generatedEntry[field];
    const actual = checkedInEntry[field];
    if (JSON.stringify(expected) === JSON.stringify(actual)) {
      continue;
    }

    return { field, expected, actual };
  }

  return null;
}

/** Validates the checked-in public search artifact against generated output. */
export function validateSearchIndex(
  options: SearchIndexValidationOptions = {},
): SearchIndexValidationResult {
  const contentRoot = options.contentRoot ?? DEFAULT_CONTENT_ROOT;
  const artifactPath = options.artifactPath ?? DEFAULT_ARTIFACT_PATH;
  const checkedInArtifactSource = readCheckedInArtifactSource(
    artifactPath,
    options.checkedInArtifactSource,
  );

  if (typeof checkedInArtifactSource !== "string") {
    return { valid: false, issues: [checkedInArtifactSource] };
  }

  const checkedInArtifact = parseArtifactSource(
    artifactPath,
    checkedInArtifactSource,
  );
  if (!("entries" in checkedInArtifact)) {
    return { valid: false, issues: [checkedInArtifact] };
  }

  const excludedEntries = collectExcludedSearchEntries(contentRoot);
  const generatedArtifact = loadPublicSearchArtifact({ contentRoot });
  const exclusionIssues = [
    ...collectExcludedEntryIssues(
      checkedInArtifact,
      excludedEntries,
      "Checked-in search artifact",
    ),
    ...collectExcludedEntryIssues(
      generatedArtifact,
      excludedEntries,
      "Generated search artifact",
    ),
  ];

  if (exclusionIssues.length > 0) {
    return {
      valid: false,
      issues: exclusionIssues,
    };
  }

  const alignmentIssues = collectArtifactAlignmentIssues(
    checkedInArtifact,
    generatedArtifact,
    artifactPath,
  );
  if (alignmentIssues.length > 0) {
    return {
      valid: false,
      issues: alignmentIssues,
    };
  }

  const generatedSource = serializePublicSearchArtifact(generatedArtifact);

  if (checkedInArtifactSource !== generatedSource) {
    return {
      valid: false,
      issues: [
        {
          field: "artifact",
          message: `Checked-in search artifact at ${artifactPath} does not match the stable generated serialization. Regenerate with bun run generate:search-index and review the diff.`,
        },
      ],
    };
  }

  return { valid: true, issues: [] };
}

/** Throws when the checked-in public search artifact contract regresses. */
export function assertValidSearchIndex(
  options: SearchIndexValidationOptions = {},
): void {
  const result = validateSearchIndex(options);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Search index validation failed:\n${details}`);
}
