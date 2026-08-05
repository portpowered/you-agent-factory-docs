import {
  reportLandingLinkValidation,
  validateLandingLinks,
} from "../src/lib/build/validate-landing-links";
import {
  reportDocumentationLinkValidation,
  validateDocumentationLinks,
} from "../src/lib/build/validate-links";

const results = await validateDocumentationLinks();
reportDocumentationLinkValidation(results);

// Landing hrefs live in TypeScript, not MDX, so next-validate-link never sees
// them. Checked separately here so `make linkcheck` covers the whole reader
// surface.
const landingErrors = await validateLandingLinks();
if (!reportLandingLinkValidation(landingErrors)) {
  process.exit(1);
}
