import {
  accessCookieName,
  refreshCookieName,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from "../config/auth.js";

export function setAuthCookies(res, tokens) {
  res.cookie(accessCookieName, tokens.accessToken, getAccessCookieOptions());
  res.cookie(refreshCookieName, tokens.refreshToken, getRefreshCookieOptions());
}

export function clearAuthCookies(res) {
  res.clearCookie(accessCookieName, { ...getAccessCookieOptions(), maxAge: undefined });
  res.clearCookie(refreshCookieName, { ...getRefreshCookieOptions(), maxAge: undefined });
}
