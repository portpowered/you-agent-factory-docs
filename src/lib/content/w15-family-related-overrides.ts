/**
 * W15 high-value cross-family related-doc overrides.
 *
 * Bidirectional pairs connect settled family destinations so readers can move
 * between contract lookup (references) and authored Factory/Worker/Workstation
 * guidance without hunting. Targets must be published registry ids under the
 * four route families when possible; missing/unpublished ids keep the existing
 * related-doc empty/unavailable/planned fallbacks rather than inventing hrefs.
 */

export type W15CrossFamilyRelatedPair = {
  readonly leftId: string;
  readonly rightId: string;
  readonly reason: string;
};

/**
 * Representative high-value pairs required by W15 story 006:
 * - references ↔ factories
 * - workers ↔ workstations
 * - references schema/API ↔ authored factory/variant page
 */
export const W15_CROSS_FAMILY_RELATED_PAIRS = [
  {
    leftId: "reference.api",
    rightId: "documentation.factories-configuration",
    reason: "references ↔ factories",
  },
  {
    leftId: "documentation.workers-agent",
    rightId: "documentation.workstations-agent-run",
    reason: "workers ↔ workstations",
  },
  {
    leftId: "reference.factory-schema",
    rightId: "documentation.factories-configuration",
    reason: "references schema ↔ factories",
  },
] as const satisfies readonly W15CrossFamilyRelatedPair[];

function buildOverrideIndex(
  pairs: readonly W15CrossFamilyRelatedPair[],
): ReadonlyMap<string, readonly string[]> {
  const index = new Map<string, string[]>();

  for (const pair of pairs) {
    const leftTargets = index.get(pair.leftId) ?? [];
    if (!leftTargets.includes(pair.rightId)) {
      leftTargets.push(pair.rightId);
    }
    index.set(pair.leftId, leftTargets);

    const rightTargets = index.get(pair.rightId) ?? [];
    if (!rightTargets.includes(pair.leftId)) {
      rightTargets.push(pair.leftId);
    }
    index.set(pair.rightId, rightTargets);
  }

  return index;
}

const W15_CROSS_FAMILY_RELATED_OVERRIDE_INDEX = buildOverrideIndex(
  W15_CROSS_FAMILY_RELATED_PAIRS,
);

/** Related registry ids declared by W15 cross-family overrides for a source. */
export function getW15CrossFamilyRelatedOverrideIds(
  registryId: string,
): readonly string[] {
  return W15_CROSS_FAMILY_RELATED_OVERRIDE_INDEX.get(registryId) ?? [];
}
