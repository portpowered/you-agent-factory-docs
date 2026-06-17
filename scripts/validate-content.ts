import { join } from "node:path";
import {
  DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH,
  readCheckedInPublicSearchArtifact,
} from "@/lib/content/load-search-artifact";
import { loadLocalizedSearchDocuments } from "@/lib/content/load-search-documents";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import {
  formatPublicContentValidationResult,
  projectCanonicalRecordsForValidation,
  validatePublicContentGraph,
} from "@/lib/content/public-content-validation";
import {
  type StarterContentValidationFailure,
  validateStarterContent,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import {
  resolveCheckedInPublicSearchArtifactPathForGate,
  resolveContentRootForGate,
  resolveStarterContentDescriptorForGate,
} from "@/lib/validation/gate-fixtures";

const fixtureDescriptor = resolveStarterContentDescriptorForGate();
if (fixtureDescriptor) {
  const result = validateStarterContent(fixtureDescriptor);
  if (!result.ok) {
    const failures: StarterContentValidationFailure[] = [result];
    assertStarterContentValid(failures);
  }
}

const contentRoot =
  resolveContentRootForGate() ?? join(import.meta.dir, "../src/content");
const { failures, variantBindings } = loadStarterContentRecords(contentRoot);
assertStarterContentValid(failures);
const localizedSearchDocuments = loadLocalizedSearchDocuments(contentRoot);
const artifactPath =
  resolveCheckedInPublicSearchArtifactPathForGate() ??
  DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH;
const publicContentResult = validatePublicContentGraph(
  {
    canonicalRecords: projectCanonicalRecordsForValidation(variantBindings),
    variantBindings,
    localizedSearchDocuments,
  },
  readCheckedInPublicSearchArtifact(artifactPath),
);

if (!publicContentResult.ok) {
  console.error("Public content validation failed");
  console.error(formatPublicContentValidationResult(publicContentResult));
  process.exit(1);
}

console.log("Content validation passed");
