import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  LOCALE_FILE_PATTERN,
  resolveLocaleFileName,
} from "@/lib/content/locale-files";
import {
  type LocalizedContentVariantBinding,
  type LocalizedVariantGroup,
  validateLocalizedVariantBindings,
} from "@/lib/content/localized-variant-identity";
import {
  STARTER_CONTENT_DIRECTORY_KINDS,
  type StarterContentDescriptor,
  type StarterContentDirectory,
  type StarterContentValidationFailure,
  type StarterContentValidationSuccess,
  buildStarterContentPathKey,
  validateStarterContent,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type { CanonicalContentRecord } from "@/lib/content/types";

export type LoadedStarterContent = {
  records: CanonicalContentRecord[];
  failures: StarterContentValidationFailure[];
  /** Reviewer-visible localized variant groups validated across parallel locale files. */
  localizedVariantGroups: LocalizedVariantGroup[];
  /** Variant locale bindings used for locale-aware navigation projection. */
  variantBindings: LocalizedContentVariantBinding[];
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
      const fileNames = readdirSync(slugRoot);
      const localeTags = new Set<string>();

      for (const fileName of fileNames) {
        if (LOCALE_FILE_PATTERN.test(fileName)) {
          localeTags.add(fileName.replace(/\.mdx?$/, ""));
        }
      }

      for (const locale of localeTags) {
        const localeFile = resolveLocaleFileName(locale, fileNames);
        if (!localeFile) {
          continue;
        }

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
function groupErrorsByContentPathKey(
  errors: StarterContentValidationFailure["errors"],
): Map<string, StarterContentValidationFailure["errors"]> {
  const grouped = new Map<string, StarterContentValidationFailure["errors"]>();

  for (const error of errors) {
    const contentPathKey = error.field.split(".")[0] ?? error.field;
    const existing = grouped.get(contentPathKey) ?? [];
    existing.push(error);
    grouped.set(contentPathKey, existing);
  }

  return grouped;
}

export function loadStarterContentRecords(
  contentRoot: string,
): LoadedStarterContent {
  const failures: StarterContentValidationFailure[] = [];
  const successes: StarterContentValidationSuccess[] = [];

  for (const descriptor of listStarterContentDescriptors(contentRoot)) {
    const result = validateStarterContent(descriptor);
    if (isValidationSuccess(result)) {
      successes.push(result);
      continue;
    }

    failures.push(result);
  }

  const bindings: LocalizedContentVariantBinding[] = successes.map(
    (success) => ({
      contentPathKey: buildStarterContentPathKey(success.descriptor),
      variantLocale: success.descriptor.locale,
      record: success.record,
    }),
  );
  const identityResult = validateLocalizedVariantBindings(bindings);
  const invalidPathKeys = new Set<string>();
  let localizedVariantGroups: LocalizedVariantGroup[] = [];

  if (!identityResult.ok) {
    const groupedErrors = groupErrorsByContentPathKey(identityResult.errors);

    for (const [contentPathKey, errors] of groupedErrors) {
      invalidPathKeys.add(contentPathKey);
      const groupSuccesses = successes.filter(
        (success) =>
          buildStarterContentPathKey(success.descriptor) === contentPathKey,
      );

      for (const success of groupSuccesses) {
        failures.push({
          ok: false,
          errors,
          descriptor: success.descriptor,
        });
      }
    }
  } else {
    localizedVariantGroups = identityResult.groups;
  }

  const records = successes
    .filter(
      (success) =>
        !invalidPathKeys.has(buildStarterContentPathKey(success.descriptor)),
    )
    .map((success) => success.record);

  records.sort((left, right) => left.id.localeCompare(right.id));
  const validBindings = bindings.filter(
    (binding) => !invalidPathKeys.has(binding.contentPathKey),
  );
  return {
    records,
    failures,
    localizedVariantGroups,
    variantBindings: validBindings,
  };
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
