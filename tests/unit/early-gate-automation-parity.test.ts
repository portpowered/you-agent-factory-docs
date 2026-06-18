import { describe, expect, test } from "bun:test";
import { dryRunMake } from "../helpers/make";

const verifyingMakeTest = process.env.VERIFYING_MAKE_TEST === "1";
const testUnlessVerifying = verifyingMakeTest ? test.skip : test;

describe("early gate automation parity", () => {
  testUnlessVerifying(
    "make quality-gate delegates to the bun quality-gate script",
    () => {
      expect(dryRunMake("quality-gate")).toContain("bun run quality-gate");
    },
  );
});
