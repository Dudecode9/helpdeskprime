const isProduction = process.env.NODE_ENV === "production";

export const accessCookieName = "access_token";
export const refreshCookieName = "refresh_token";

export function getAllowedOrigins() {
  return (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173,http://localhost")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}
