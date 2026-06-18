import { createServer } from "node:net";

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

export async function findUsableTestPort(
  defaultPort: number,
  envVar: string,
): Promise<number> {
  const configuredPort = getTestPort(defaultPort, envVar);

  if (process.env[envVar]) {
    return configuredPort;
  }

  return await new Promise<number>((resolve, reject) => {
    const listen = (port: number) => {
      const server = createServer();
      server.unref();
      server.once("error", (error) => {
        server.close();

        if (port !== 0) {
          listen(0);
          return;
        }

        reject(error);
      });
      server.listen(port, "127.0.0.1", () => {
        const address = server.address();

        if (!address || typeof address === "string") {
          server.close();
          reject(new Error("Could not determine a usable test port."));
          return;
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(address.port);
        });
      });
    };

    listen(configuredPort);
  });
}
