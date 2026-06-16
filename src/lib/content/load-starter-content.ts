import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LOCALE_FILE_PATTERN } from "@/lib/content/locale-files";
import {
  STARTER_CONTENT_DIRECTORY_KINDS,
  type StarterContentDescriptor,
  type StarterContentDirectory,
  type StarterContentValidationFailure,
  type StarterContentValidationSuccess,
  validateStarterContent,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type { CanonicalContentRecord } from "@/lib/content/types";

export type LoadedStarterContent = {
  records: CanonicalContentRecord[];
  failures: StarterContentValidationFailure[];
};

function isStarterContentDirectory(
  directoryName: string,
): directoryName is StarterContentDirectory {
  return directoryName in STARTER_CONTENT_DIRECTORY_KINDS;
}

function listStarterContentDescriptors(
  contentRoot: string,
): StarterContentDescriptor[] {
  const descriptors: StarterContentDescriptor[] = [];

  for (const contentDirectory of Object.keys(
    STARTER_CONTENT_DIRECTORY_KINDS,
  ) as StarterContentDirectory[]) {
    const kindRoot = join(contentRoot, contentDirectory);
    let slugEntries: string[] = [];

    try {
      slugEntries = readdirSync(kindRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      continue;
    }

    for (const slug of slugEntries) {
      const slugRoot = join(kindRoot, slug);
      const localeFiles = readdirSync(slugRoot).filter((fileName) =>
        LOCALE_FILE_PATTERN.test(fileName),
      );

      for (const localeFile of localeFiles) {
        const locale = localeFile.replace(/\.mdx?$/, "");
        descriptors.push({
          contentDirectory,
          slug,
          locale,
          source: readFileSync(join(slugRoot, localeFile), "utf8"),
        });
      }
    }
  }

  return descriptors;
}

function isValidationSuccess(
  result: StarterContentValidationSuccess | StarterContentValidationFailure,
): result is StarterContentValidationSuccess {
  return result.ok;
}

/**
 * Loads starter content fixtures from the canonical content directories and
 * validates each locale variant into canonical content records.
 */
export function loadStarterContentRecords(
  contentRoot: string,
): LoadedStarterContent {
  const records: CanonicalContentRecord[] = [];
  const failures: StarterContentValidationFailure[] = [];

  for (const descriptor of listStarterContentDescriptors(contentRoot)) {
    const result = validateStarterContent(descriptor);
    if (isValidationSuccess(result)) {
      records.push(result.record);
      continue;
    }

    failures.push(result);
  }

  records.sort((left, right) => left.id.localeCompare(right.id));
  return { records, failures };
}

/**
 * Loads starter content fixtures and fails when any fixture is invalid.
 */
export function requireStarterContentRecords(
  contentRoot: string,
): CanonicalContentRecord[] {
  const { records, failures } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);
  return records;
}

export function starterContentRootExists(contentRoot: string): boolean {
  try {
    return statSync(contentRoot).isDirectory();
  } catch {
    return false;
  }
}
