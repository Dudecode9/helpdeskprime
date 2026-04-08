import { pool } from "../config/db.js";

export async function createUserSession({ sessionJti, user, ip, userAgent }) {
  await pool.query(
    `INSERT INTO user_sessions
      (session_jti, user_id, email, role, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (session_jti) DO UPDATE
     SET last_seen_at = CURRENT_TIMESTAMP,
         logout_at = NULL,
         is_online = TRUE,
         ip = EXCLUDED.ip,
         user_agent = EXCLUDED.user_agent`,
    [sessionJti, user.id, user.email, user.role, ip, userAgent]
  );
}

export async function touchUserSession(sessionJti) {
  if (!sessionJti) {
    return;
  }

  await pool.query(
    `UPDATE user_sessions
     SET last_seen_at = CURRENT_TIMESTAMP,
         is_online = TRUE
     WHERE session_jti = $1`,
    [sessionJti]
  );
}

export async function endUserSession(sessionJti) {
  if (!sessionJti) {
    return;
  }

  await pool.query(
    `UPDATE user_sessions
     SET logout_at = CURRENT_TIMESTAMP,
         is_online = FALSE
     WHERE session_jti = $1`,
    [sessionJti]
  );
}

export async function markInactiveSessions(idleMinutes = 3) {
  await pool.query(
    `UPDATE user_sessions
     SET is_online = FALSE
     WHERE is_online = TRUE
       AND last_seen_at < CURRENT_TIMESTAMP - ($1::text || ' minutes')::interval`,
    [String(idleMinutes)]
  );
}

export async function listOnlineUsers(idleMinutes = 3) {
  await markInactiveSessions(idleMinutes);

  const result = await pool.query(
    `SELECT id, user_id, email, role, login_at, last_seen_at, ip, user_agent, is_online
     FROM user_sessions
     WHERE is_online = TRUE
     ORDER BY last_seen_at DESC`
  );

  return result.rows;
}
