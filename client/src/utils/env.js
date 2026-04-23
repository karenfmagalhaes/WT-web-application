const normalizeEnvValue = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const parcelApiUrl = normalizeEnvValue(process.env.PARCEL_PUBLIC_API_URL);
const viteApiUrl = normalizeEnvValue(process.env.VITE_API_URL);
const parcelBypassFlag = normalizeEnvValue(process.env.PARCEL_PUBLIC_ENABLE_DEV_AUTH_BYPASS);
const viteBypassFlag = normalizeEnvValue(process.env.VITE_ENABLE_DEV_AUTH_BYPASS);

export const API_BASE_URL = parcelApiUrl || viteApiUrl || "http://localhost:5000/api";

export const DEV_AUTH_BYPASS = (parcelBypassFlag || viteBypassFlag) === "true";
