/** Re-export shared axe helpers used by component a11y smokes and page probes. */
export {
  type AxeRunOptions,
  expectNoSeriousAxeViolations,
  expectSeriousAxeViolations,
  getSeriousViolations,
  runAxeOnElement,
} from "@/lib/verify/a11y-axe";
