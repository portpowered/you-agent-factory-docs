import { join } from "node:path";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import {
  getPublicContentGraph,
  getPublicLocalizedSearchArtifact,
} from "@/lib/content/public-content";
import {
  formatPublicContentValidationResult,
  validatePublicContentGraph,
} from "@/lib/content/public-content-validation";
import {
  type StarterContentValidationFailure,
  validateStarterContent,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import {
  resolvePublicContentValidationFixtureForGate,
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

const contentRoot = join(import.meta.dir, "../src/content");
const { failures } = loadStarterContentRecords(contentRoot);
assertStarterContentValid(failures);

const publicContentFixture = resolvePublicContentValidationFixtureForGate();
const publicContentResult = validatePublicContentGraph(
  publicContentFixture?.graph ?? getPublicContentGraph(),
  publicContentFixture?.localizedSearchArtifact ??
    getPublicLocalizedSearchArtifact(),
);

if (!publicContentResult.ok) {
  console.error("Public content validation failed");
  console.error(formatPublicContentValidationResult(publicContentResult));
  process.exit(1);
}

console.log("Content validation passed");
