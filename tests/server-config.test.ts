// @vitest-environment node
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import { afterEach, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({ app: null as Express | null }));
vi.mock("dotenv/config", () => ({}));
vi.mock("vite", () => ({
  createServer: vi.fn(async () => ({ middlewares: (_req: unknown, _res: unknown, next: () => void) => next() })),
}));
vi.mock("../lib/brvm/service.js", () => ({
  companyDescription: vi.fn(), listStocks: vi.fn(), syncDividendsForSymbol: vi.fn(),
  syncQuotations: vi.fn(), analyzeBulletin: vi.fn(),
}));
vi.mock("express", async (importOriginal) => {
  const { default: express } = await importOriginal<{ default: typeof import("express") }>();
  return { default: Object.assign(() => {
    const app = express();
    vi.spyOn(app, "listen").mockImplementation(() => undefined as never);
    captured.app = app;
    return app;
  }, express) };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it.each([
  [undefined, undefined, undefined, false, "127.0.0.1"],
  ["1", undefined, undefined, false, "127.0.0.1"],
  ["1", "false", undefined, false, "127.0.0.1"],
  [undefined, "true", undefined, false, "127.0.0.1"],
  ["0", "true", undefined, false, "127.0.0.1"],
  ["-1", "true", undefined, false, "127.0.0.1"],
  ["1.5", "true", undefined, false, "127.0.0.1"],
  ["invalid", "true", undefined, false, "127.0.0.1"],
  ["1", "true", "0.0.0.0", 1, "0.0.0.0"],
] as const)("configures proxy=%s confirmation=%s host=%s", async (trust, confirmed, host, expectedTrust, expectedHost) => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("TRUST_PROXY", trust);
  vi.stubEnv("REVERSE_PROXY", confirmed);
  vi.stubEnv("HOST", host);
  vi.stubEnv("PORT", "3000");
  await import("../server");
  const app = captured.app!;
  expect(app.get("trust proxy")).toBe(expectedTrust);
  expect(app.listen).toHaveBeenCalledWith(3000, expectedHost, expect.any(Function));

  // Exercise Express's actual client IP resolution with an injected forwarded header.
  app.get("/test/ip", (req, res) => res.json({ ip: req.ip }));
  const server = createServer(app);
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/test/ip`, {
      headers: { "X-Forwarded-For": "198.51.100.42" },
    });
    expect(await response.json()).toEqual({ ip: expectedTrust ? "198.51.100.42" : "127.0.0.1" });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
