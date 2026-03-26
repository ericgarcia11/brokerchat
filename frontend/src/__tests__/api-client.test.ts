/**
 * @jest-environment jsdom
 */

// Tests for the API client module
// We mock fetch to test request construction
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout (not available in jsdom)
if (!AbortSignal.timeout) {
  (AbortSignal as any).timeout = (_ms: number) => new AbortController().signal;
}

// Mock localStorage  
const store: Record<string, string> = { wwp_token: "test-jwt-token" };
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
  },
});

// Reset modules to pick up mock
beforeEach(() => {
  mockFetch.mockReset();
});

describe("apiClient", () => {
  it("sends Authorization Bearer header from localStorage", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    });

    // Dynamic import to get fresh module after mocks are set
    const { apiClient } = await import("@/lib/api/client");
    await apiClient.get("/health");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/health");
    expect(options.headers["Authorization"]).toBe("Bearer test-jwt-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("builds query string for GET params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { apiClient } = await import("@/lib/api/client");
    await apiClient.get("/admin/chats", { empresa_id: "abc", limit: 10 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("empresa_id=abc");
    expect(url).toContain("limit=10");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Internal error" }),
    });

    const { apiClient } = await import("@/lib/api/client");
    await expect(apiClient.get("/health")).rejects.toThrow();
  });
});
