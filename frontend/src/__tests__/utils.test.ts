import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined", () => {
    expect(cn("a", undefined, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts", () => {
    // tailwind-merge should resolve conflicting classes
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });
});
