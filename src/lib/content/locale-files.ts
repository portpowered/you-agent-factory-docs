/** Matches BCP 47 locale tags with `.md` or `.mdx` starter-content file extensions. */
export const LOCALE_FILE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?\.mdx?$/;

const LOCALE_FILE_EXTENSIONS = [".mdx", ".md"] as const;

/**
 * Resolves the on-disk locale filename for a starter-content slug directory.
 * Prefers `.mdx` over `.md` when both exist for the same locale tag.
 */
export function resolveLocaleFileName(
  locale: string,
  fileNames: string[],
): string | undefined {
  const localeFiles = new Set(
    fileNames.filter((fileName) => LOCALE_FILE_PATTERN.test(fileName)),
  );

  for (const extension of LOCALE_FILE_EXTENSIONS) {
    const candidate = `${locale}${extension}`;
    if (localeFiles.has(candidate)) {
      return candidate;
    }
  }

  return undefined;
}
