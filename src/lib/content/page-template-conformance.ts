import type { PageKind } from "./schemas";
import type { ValidationError } from "./validate-registry";

/**
 * Per-kind MDX template conformance (rigid section order and component
 * structure checked against `docs/templates/<kind>.mdx`) applied only to the
 * retired Model Atlas page kinds. None of the current factory page kinds
 * (`concept`, `guide`, `technique`, `documentation`, `glossary`) opt into this
 * check, so this validator is a no-op today. Kept as a stable extension point
 * in case a future factory kind needs the same rigid template conformance.
 */
export function validatePageTemplateConformance(_options: {
  pagePath: string;
  docsRoot: string;
  kind: PageKind;
  mdxSource: string;
}): ValidationError[] {
  return [];
}
