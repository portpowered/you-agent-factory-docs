/**
 * Shared prop contracts for W10 reference chrome (CLI / MCP / JavaScript).
 *
 * Projection-oriented: callers pass already-normalized fields. These types do
 * not acquire package artifacts or invent missing contract text.
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import type {
  ReferenceFamily,
  ReferenceLifecycle,
  ReferenceSourcePointer,
} from "@/lib/references/reference-item";

/** Documentation visibility published on package contract exports. */
export const REFERENCE_VISIBILITY_VALUES = ["public", "internal"] as const;

export type ReferenceVisibility = (typeof REFERENCE_VISIBILITY_VALUES)[number];

export type ContractSourceBadgeProps = {
  family: ReferenceFamily;
  /** Lifecycle block when published on the normalized item. */
  lifecycle?: ReferenceLifecycle;
  /**
   * Package version when known from the resolved manifest identity. Absent
   * when the caller has no package version — never invent a version string.
   */
  packageVersion?: string;
  source: ReferenceSourcePointer;
  /** Visibility when published on the contract/projection. */
  visibility?: ReferenceVisibility;
  /** Localized reference chrome; omit only in isolated English unit tests. */
  chrome?: ReferenceChromeMessages;
  className?: string;
};

export type ReferenceLifecycleVisibilityProps = {
  lifecycle?: ReferenceLifecycle;
  visibility?: ReferenceVisibility;
  chrome?: ReferenceChromeMessages;
  className?: string;
};

export type ReferenceEmptyStateProps = {
  title: string;
  description: string;
  /** Optional family label for the empty inventory context. */
  family?: ReferenceFamily;
  chrome?: ReferenceChromeMessages;
  className?: string;
};

export type ReferenceErrorStateProps = {
  title: string;
  description: string;
  /** Optional diagnostic detail (for example a parse error message). */
  detail?: string;
  family?: ReferenceFamily;
  chrome?: ReferenceChromeMessages;
  className?: string;
};
