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

-- ============================================
-- Вставка системных пользователей (если их нет)
-- ============================================

-- Администратор (логин: admin@gmail.com, пароль: 1)
INSERT INTO admins (email, password)
VALUES ('admin@gmail.com', '$2b$10$2o01WpkoJlRhCAdB4knjienv.WwDAJqLpYHSI.TJ65SrDWv9vSYKO')
ON CONFLICT (email) DO NOTHING;

-- Директор (логин: director@gmail.com, пароль: 1)
INSERT INTO directordev (email, password)
VALUES ('director@gmail.com', '$2b$10$xf1LG9Cd5HjAYxxRJLgw6.PqhlwfDR4XEC2hUSD.EaupZyrqGNAMy')
ON CONFLICT (email) DO NOTHING;