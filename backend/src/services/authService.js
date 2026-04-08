import { pool } from "../config/db.js";
import { createTokenBundle } from "../utils/tokens.js";

export async function storeRefreshToken(session) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, user_role, jti, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [session.user.id, session.user.role, session.jti, session.expiresAt]
  );
}

export async function revokeRefreshTokenByJti(jti) {
  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE jti = $1 AND revoked_at IS NULL`,
    [jti]
  );
}

export async function findActiveRefreshToken(jti) {
  const result = await pool.query(
    `SELECT *
     FROM refresh_tokens
     WHERE jti = $1
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP`,
    [jti]
  );

  return result.rows[0];
}

export async function issueSession(user) {
  const tokens = createTokenBundle(user);
  await storeRefreshToken({ ...tokens, user });
  return tokens;
}
