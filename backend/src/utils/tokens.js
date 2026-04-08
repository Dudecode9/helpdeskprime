import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

export function buildAuthUser(user, role) {
  return {
    id: user.id,
    email: user.email,
    role,
  };
}

export function signAccessToken(user, sessionJti) {
  return jwt.sign({ ...user, sessionJti }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(user, jti) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function createTokenBundle(user) {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(user, jti);
  const refreshToken = signRefreshToken(user, jti);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  return { accessToken, refreshToken, jti, expiresAt };
}
