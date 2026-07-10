/**
 * Render a JSON-compatible value as a Biome-stable TypeScript literal.
 *
 * Object keys that are valid JS identifiers are left unquoted (matching
 * `biome format`); other keys stay JSON-quoted. Arrays and objects use
 * trailing commas and 2-space indentation so generators can emit
 * contracted runtime modules without a per-file biome subprocess.
 */
export function renderTypescriptLiteral(
  value: unknown,
  indentLevel = 0,
): string {
  const indent = "  ".repeat(indentLevel);
  const nestedIndent = "  ".repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    return [
      "[",
      ...value.map(
        (entry) =>
          `${nestedIndent}${renderTypescriptLiteral(entry, indentLevel + 1)},`,
      ),
      `${indent}]`,
    ].join("\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }

    return [
      "{",
      ...entries.map(
        ([key, entryValue]) =>
          `${nestedIndent}${renderTypescriptIdentifierKey(key)}: ${renderTypescriptLiteral(entryValue, indentLevel + 1)},`,
      ),
      `${indent}}`,
    ].join("\n");
  }

  return JSON.stringify(value);
}

function renderTypescriptIdentifierKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/u.test(key) ? key : JSON.stringify(key);
}
