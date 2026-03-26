/**
 * @jest-environment jsdom
 */
import { setSession, getToken, getUser, clearSession, isAuthenticated } from "@/lib/auth/session";

beforeEach(() => {
  localStorage.clear();
});

describe("session", () => {
  it("isAuthenticated returns false when no token", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("setSession + isAuthenticated", () => {
    setSession("test-token-123", { nome: "Test" });
    expect(isAuthenticated()).toBe(true);
  });

  it("getToken returns stored token", () => {
    setSession("my-token", { nome: "Test" });
    expect(getToken()).toBe("my-token");
  });

  it("getUser returns stored user", () => {
    setSession("tok", { nome: "Luiz", papel: "admin" });
    expect(getUser()).toEqual({ nome: "Luiz", papel: "admin" });
  });

  it("clearSession removes token and user", () => {
    setSession("token", { nome: "Test" });
    expect(isAuthenticated()).toBe(true);
    clearSession();
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});
