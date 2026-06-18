import { createServer } from "node:net";

async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const probe = createServer();
    probe.unref();

    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.unref();

    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();

      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Unable to determine an available localhost port"));
        return;
      }

      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

export async function getTestPort(
  defaultPort: number,
  envVar: string,
): Promise<number> {
  const fromEnv = process.env[envVar];
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (await isPortAvailable(defaultPort)) {
    return defaultPort;
  }

  return await findAvailablePort();
}
