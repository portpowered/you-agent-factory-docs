import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type PublicSearchArtifact,
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

  const generatedSource = serializePublicSearchArtifact(generatedArtifact);

  if (checkedInArtifactSource !== generatedSource) {
    return {
      valid: false,
      issues: [
        {
          field: "artifact",
          message: `Checked-in search artifact at ${artifactPath} does not match generated artifact. Regenerate with bun run generate:search-index and review the diff.`,
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
