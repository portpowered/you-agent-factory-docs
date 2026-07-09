import type { PageMessages } from "@/lib/content/schemas";

/**
 * Atlas page-message imports for registry-backed graphs were removed with the
 * Model Atlas domain. Keep the lookup API so graph consumers compile against an
 * empty subject map until later stories retire those surfaces.
 */
const messagesBySubjectId = new Map<string, PageMessages>();

/** Returns canonical subject messages for registry-backed graphs when available. */
export function getGraphSubjectMessages(
  subjectId: string,
): PageMessages | undefined {
  return messagesBySubjectId.get(subjectId);
}

export function getGraphRegistryMessages(
  registryId: string,
): PageMessages | undefined {
  return messagesBySubjectId.get(registryId);
}
