import {
  formatValidationErrors,
  validateRegistryContent,
} from "../src/lib/content/validate-registry";

const VALIDATE_DATA_COMMAND = "make validate-data";

const errors = await validateRegistryContent();

if (errors.length > 0) {
  console.error(formatValidationErrors(errors));
  console.error(`\nReproduce locally with: ${VALIDATE_DATA_COMMAND}`);
  process.exit(1);
}

console.log("Registry validation passed.");
process.exit(0);
