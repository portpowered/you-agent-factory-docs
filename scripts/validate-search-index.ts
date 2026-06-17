import {
  resolveSearchArtifactSourceForGate,
  resolveSearchContentRootForGate,
} from "@/lib/validation/gate-fixtures";
import { assertValidSearchIndex } from "@/lib/validation/search-index";

const checkedInArtifactSource = resolveSearchArtifactSourceForGate();
const contentRoot = resolveSearchContentRootForGate();

assertValidSearchIndex({
  contentRoot: contentRoot ?? undefined,
  checkedInArtifactSource: checkedInArtifactSource ?? undefined,
});

console.log("Search index validation passed");
