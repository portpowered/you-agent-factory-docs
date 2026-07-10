import { ensureStaticExportImmutableSnapshot } from "../src/lib/build/static-export-immutable-snapshot";

const forceClean =
  process.argv.includes("--force-clean") ||
  process.env.STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FORCE === "1";

const result = ensureStaticExportImmutableSnapshot({
  cwd: process.cwd(),
  forceClean,
});

if (result.action === "reused") {
  console.log(
    `[static-export-immutable-snapshot] Reused fingerprint ${result.fingerprint.slice(0, 12)}…`,
  );
} else {
  console.log(
    `[static-export-immutable-snapshot] Regenerated (${result.reason}); fingerprint ${result.fingerprint.slice(0, 12)}…`,
  );
}
