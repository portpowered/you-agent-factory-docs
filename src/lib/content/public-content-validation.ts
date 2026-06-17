import {
  type PublicContentEntry,
  type PublicContentGraph,
  type PublicContentKind,
  SUPPORTED_PUBLIC_CONTENT_KINDS,
} from "@/lib/content/public-content";

export type PublicContentValidationIssue = {
  code: "missing_kind_coverage";
  kind: PublicContentKind;
  message: string;
};

export type PublicContentValidationResult =
  | {
      ok: true;
      coveredKinds: PublicContentKind[];
      issues: [];
    }
  | {
      ok: false;
      coveredKinds: PublicContentKind[];
      issues: PublicContentValidationIssue[];
    };

function collectCoveredKinds(
  entries: PublicContentEntry[],
): PublicContentKind[] {
  const coveredKinds = new Set(entries.map((entry) => entry.kind));

  return SUPPORTED_PUBLIC_CONTENT_KINDS.filter((kind) =>
    coveredKinds.has(kind),
  );
}

export function validatePublicContentGraph(
  graph: PublicContentGraph,
): PublicContentValidationResult {
  const coveredKinds = collectCoveredKinds(graph.entries);
  const issues = SUPPORTED_PUBLIC_CONTENT_KINDS.flatMap((kind) => {
    if (coveredKinds.includes(kind)) {
      return [];
    }

    return [
      {
        code: "missing_kind_coverage" as const,
        kind,
        message: `Public content validation is missing ${kind} coverage.`,
      },
    ];
  });

  if (issues.length === 0) {
    return {
      ok: true,
      coveredKinds,
      issues: [],
    };
  }

  return {
    ok: false,
    coveredKinds,
    issues,
  };
}

export function formatPublicContentValidationResult(
  result: PublicContentValidationResult,
): string {
  if (result.ok) {
    return `Public content validation passed for kinds: ${result.coveredKinds.join(", ")}.`;
  }

  return result.issues.map((issue) => issue.message).join("\n");
}
