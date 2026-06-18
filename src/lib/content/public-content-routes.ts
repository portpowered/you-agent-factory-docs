import { join } from "node:path";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type {
  CanonicalContentRecord,
  PublicContentKind,
} from "@/lib/content/types";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

export type PublicContentRouteParams = {
  kind: PublicContentKind;
  slug: string;
};

export type ListPublishedPublicContentRouteParamsOptions = {
  supportedKinds?: PublicContentKind[];
};

function isSupportedKind(
  record: CanonicalContentRecord,
  supportedKinds: Set<PublicContentKind>,
): boolean {
  return supportedKinds.has(record.kind);
}

/**
 * Projects published public-route params from validated canonical content
 * records so route generation stays aligned with the content model.
 */
export function listPublishedPublicContentRouteParams(
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: ListPublishedPublicContentRouteParamsOptions,
): PublicContentRouteParams[] {
  const { records, failures } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  const supportedKinds = new Set<PublicContentKind>(
    options?.supportedKinds ?? ["blog", "glossary", "comparison", "reference"],
  );

  return records
    .filter(
      (record) =>
        record.status === "published" &&
        isSupportedKind(record, supportedKinds),
    )
    .map((record) => ({
      kind: record.kind,
      slug: record.slug,
    }))
    .sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        left.slug.localeCompare(right.slug),
    );
}
