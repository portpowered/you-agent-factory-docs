import { resolveSearchArtifactSourceForGate } from "@/lib/validation/gate-fixtures";
import { assertValidSearchIndex } from "@/lib/validation/search-index";

const checkedInArtifactSource = resolveSearchArtifactSourceForGate();

assertValidSearchIndex({
  checkedInArtifactSource: checkedInArtifactSource ?? undefined,
});

console.log("Search index validation passed");
