import {
  SUPPORTED_PUBLIC_CONTENT_KINDS,
  getPublicContentGraph,
} from "@/lib/content/public-content";
import {
  formatPublicContentValidationResult,
  validatePublicContentGraph,
} from "@/lib/content/public-content-validation";

const validationResult = validatePublicContentGraph(getPublicContentGraph());

if (!validationResult.ok) {
  console.error(formatPublicContentValidationResult(validationResult));
  process.exit(1);
}

console.log(
  [
    formatPublicContentValidationResult(validationResult),
    `Supported kinds: ${SUPPORTED_PUBLIC_CONTENT_KINDS.join(", ")}.`,
  ].join("\n"),
);
