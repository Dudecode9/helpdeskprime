-- ============================================
-- Таблица администраторов
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Таблица директоров
-- ============================================
CREATE TABLE IF NOT EXISTS directordev (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Таблица активных заявок
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    admin_email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Таблица закрытых заявок
-- ============================================
CREATE TABLE IF NOT EXISTS completed_tickets (
    id SERIAL PRIMARY KEY,
    original_ticket_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INTEGER NOT NULL,
    admin_email VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    jti UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_user_id INTEGER,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'success',
    message TEXT NOT NULL,
    ip VARCHAR(100),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_jti UUID NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP,
    ip VARCHAR(100),
    user_agent TEXT,
    is_online BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_completed_tickets_email ON completed_tickets(email);
CREATE INDEX IF NOT EXISTS idx_completed_tickets_completed_at ON completed_tickets(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completed_tickets_admin_email ON completed_tickets(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen_at ON user_sessions(last_seen_at DESC);

-- ============================================
-- Вставка системных пользователей (если их нет)
-- ============================================

-- Администратор (логин: admin@gmail.com, пароль: 1)
INSERT INTO admins (email, password)
VALUES ('admin@gmail.com', '$2b$10$iyL8j0Cww4OH4dKWXz7XxeMbrVlIQflqXGYHCe3X9cdvZSXQKlu1S')
ON CONFLICT (email) DO NOTHING;

-- Директор (логин: director@gmail.com, пароль: 1)
INSERT INTO directordev (email, password)
VALUES ('director@gmail.com', '$2b$10$K7yBnkgQPW4jmOkvtnvDJeJO7D4IHyVTQwa4uoAVfSpVrxNjmLfo6')
ON CONFLICT (email) DO NOTHING;
