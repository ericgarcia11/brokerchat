export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "WWP - CRM Imobiliário",
  pollIntervalMs: Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 5000,
  empresaId: process.env.NEXT_PUBLIC_EMPRESA_ID || "00000000-0000-0000-0000-000000000001",
};
