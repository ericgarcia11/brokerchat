import { formatDate, formatDateTime, formatTime, formatCurrency, formatPhone, truncate, formatMessageDate } from "@/lib/formatters";

describe("formatDate", () => {
  it("formats ISO date to dd/MM/yyyy", () => {
    expect(formatDate("2024-06-15T10:30:00Z")).toBe("15/06/2024");
  });

  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formats ISO date to dd/MM/yyyy HH:mm", () => {
    const result = formatDateTime("2024-06-15T10:30:00Z");
    expect(result).toMatch(/15\/06\/2024/);
  });
});

describe("formatTime", () => {
  it("returns empty for null", () => {
    expect(formatTime(null)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats BRL currency", () => {
    expect(formatCurrency(250000)).toContain("250.000");
  });

  it("returns dash for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });
});

describe("formatPhone", () => {
  it("formats Brazilian phone +55DDDXXXXXXXXX", () => {
    expect(formatPhone("+5511999887766")).toBe("+55 (11) 99988-7766");
  });

  it("returns dash for null", () => {
    expect(formatPhone(null)).toBe("—");
  });

  it("returns original if not Brazilian format", () => {
    expect(formatPhone("+1234567")).toBe("+1234567");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    const long = "a".repeat(100);
    const result = truncate(long, 10);
    expect(result).toHaveLength(11); // 10 + ellipsis char
    expect(result).toContain("…");
  });

  it("does not truncate short text", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns empty for null", () => {
    expect(truncate(null)).toBe("");
  });
});

describe("formatMessageDate", () => {
  it("returns 'Hoje' for today", () => {
    const today = new Date().toISOString();
    expect(formatMessageDate(today)).toBe("Hoje");
  });

  it("returns 'Ontem' for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatMessageDate(yesterday)).toBe("Ontem");
  });

  it("returns formatted date for older dates", () => {
    // Use noon UTC to avoid timezone shift changing the date
    expect(formatMessageDate("2024-01-15T12:00:00Z")).toBe("15/01/2024");
  });
});
