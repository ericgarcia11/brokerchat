import { env } from "@/lib/env";

describe("env", () => {
  it("has apiBaseUrl defined", () => {
    expect(env.apiBaseUrl).toBeDefined();
    expect(typeof env.apiBaseUrl).toBe("string");
  });

  it("has empresaId as valid UUID format", () => {
    expect(env.empresaId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("has pollIntervalMs as number", () => {
    expect(typeof env.pollIntervalMs).toBe("number");
    expect(env.pollIntervalMs).toBeGreaterThan(0);
  });
});
