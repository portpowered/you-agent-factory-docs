export function getTestPort(defaultPort: number, envVar: string): number {
  const fromEnv = process.env[envVar];
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return defaultPort;
}
