/**
 * Behavioral dual-URL probe targets for trailing-slash directory landings.
 *
 * GitHub Pages serves `/docs/factories` and `/docs/factories/` from
 * `docs/factories/index.html`. Callers fetch both forms and assert HTTP 200.
 */

export type DirectoryLandingUrlFormProbe = {
  route: string;
  nonSlashUrl: string;
  trailingSlashUrl: string;
};

/**
 * Builds absolute probe URLs for each route under a static-export server base
 * URL (which may already include a project-site base path).
 */
export function directoryLandingUrlFormProbes(
  baseUrl: string,
  routes: readonly string[],
): DirectoryLandingUrlFormProbe[] {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return routes.map((route) => {
    const path = route.startsWith("/") ? route : `/${route}`;
    const nonSlashPath = path.endsWith("/") ? path.slice(0, -1) : path;
    return {
      route: nonSlashPath === "" ? "/" : nonSlashPath,
      nonSlashUrl: `${normalizedBase}${nonSlashPath === "" ? "/" : nonSlashPath}`,
      trailingSlashUrl: `${normalizedBase}${nonSlashPath}/`,
    };
  });
}

export type DirectoryLandingUrlFormStatus = {
  route: string;
  nonSlashStatus: number;
  trailingSlashStatus: number;
};

/** True when every route returned HTTP 200 for both URL forms. */
export function directoryLandingUrlFormsSucceeded(
  results: readonly DirectoryLandingUrlFormStatus[],
): boolean {
  return results.every(
    (result) =>
      result.nonSlashStatus === 200 && result.trailingSlashStatus === 200,
  );
}
