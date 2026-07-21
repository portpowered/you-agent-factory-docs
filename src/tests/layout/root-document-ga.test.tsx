import { afterEach, describe, expect, test } from "bun:test";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { RootDocument } from "@/app/root-layout.shared";
import {
  GA_MEASUREMENT_ID_ENV,
  GA_MEASUREMENT_ID_FALLBACK,
} from "@/lib/analytics/ga-measurement-id";

type DangerousHtmlProps = {
  dangerouslySetInnerHTML?: { __html?: string };
  src?: string;
};

function collectElements(
  node: ReactNode,
  matches: ReactElement[] = [],
): ReactElement[] {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    matches.push(child);
    collectElements(
      (child.props as { children?: ReactNode }).children,
      matches,
    );
  });
  return matches;
}

function googleAnalyticsMounts(tree: ReactNode): ReactElement[] {
  return collectElements(tree).filter((el) => el.type === GoogleAnalytics);
}

function rawGtagArtifacts(tree: ReactNode): ReactElement[] {
  return collectElements(tree).filter((el) => {
    if (el.type === GoogleAnalytics) {
      return false;
    }
    if (el.type === "script") {
      const props = el.props as DangerousHtmlProps;
      const src = props.src ?? "";
      const html = props.dangerouslySetInnerHTML?.__html ?? "";
      return /gtag|googletagmanager\.com\/gtag/i.test(`${src}\n${html}`);
    }
    const props = el.props as DangerousHtmlProps;
    const html = props.dangerouslySetInnerHTML?.__html ?? "";
    return /gtag\s*\(|googletagmanager\.com\/gtag/i.test(html);
  });
}

describe("RootDocument Google Analytics mount", () => {
  const originalEnv = process.env[GA_MEASUREMENT_ID_ENV];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[GA_MEASUREMENT_ID_ENV];
    } else {
      process.env[GA_MEASUREMENT_ID_ENV] = originalEnv;
    }
  });

  test("renders GoogleAnalytics once for a known Measurement ID", () => {
    process.env[GA_MEASUREMENT_ID_ENV] = "G-TESTMOUNT01";

    // Call as a function so the mount runs (JSX would leave RootDocument unevaluated).
    const tree = RootDocument({
      children: <div>fixture</div>,
      lang: "en",
    });
    const mounts = googleAnalyticsMounts(tree);

    expect(mounts).toHaveLength(1);
    expect((mounts[0]?.props as { gaId: string }).gaId).toBe("G-TESTMOUNT01");
  });

  test("uses the hardcoded fallback ID when the env override is unset", () => {
    delete process.env[GA_MEASUREMENT_ID_ENV];

    const tree = RootDocument({
      children: <div>fixture</div>,
      lang: "en",
    });
    const mounts = googleAnalyticsMounts(tree);

    expect(mounts).toHaveLength(1);
    expect((mounts[0]?.props as { gaId: string }).gaId).toBe(
      GA_MEASUREMENT_ID_FALLBACK,
    );
  });

  test("omits GoogleAnalytics when the Measurement ID is explicit empty-omit", () => {
    process.env[GA_MEASUREMENT_ID_ENV] = "";

    const tree = RootDocument({
      children: <div>fixture</div>,
      lang: "en",
    });

    expect(googleAnalyticsMounts(tree)).toHaveLength(0);
  });

  test("does not inject raw gtag HTML alongside the third-parties mount", () => {
    process.env[GA_MEASUREMENT_ID_ENV] = "G-TESTMOUNT01";

    const tree = RootDocument({
      children: <div>fixture</div>,
      lang: "en",
    });

    expect(googleAnalyticsMounts(tree)).toHaveLength(1);
    expect(rawGtagArtifacts(tree)).toHaveLength(0);
  });
});
