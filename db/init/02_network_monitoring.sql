CREATE TABLE IF NOT EXISTS network_interfaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    mac_address VARCHAR(64),
    ipv4_address VARCHAR(64),
    ipv6_address VARCHAR(64),
    operstate VARCHAR(32) NOT NULL DEFAULT 'unknown',
    is_loopback BOOLEAN NOT NULL DEFAULT FALSE,
    is_up BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin_up BOOLEAN NOT NULL DEFAULT FALSE,
    carrier BOOLEAN,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (name <> '')
);

CREATE TABLE IF NOT EXISTS network_metrics (
    id BIGSERIAL PRIMARY KEY,
    interface_id INTEGER NOT NULL REFERENCES network_interfaces(id) ON DELETE CASCADE,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rx_bytes BIGINT NOT NULL DEFAULT 0,
    tx_bytes BIGINT NOT NULL DEFAULT 0,
    rx_packets BIGINT NOT NULL DEFAULT 0,
    tx_packets BIGINT NOT NULL DEFAULT 0,
    rx_errors BIGINT NOT NULL DEFAULT 0,
    tx_errors BIGINT NOT NULL DEFAULT 0,
    rx_dropped BIGINT NOT NULL DEFAULT 0,
    tx_dropped BIGINT NOT NULL DEFAULT 0,
    rx_bytes_per_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
    tx_bytes_per_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
    rx_packets_per_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
    tx_packets_per_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'unknown',
    is_up BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin_up BOOLEAN NOT NULL DEFAULT FALSE,
    carrier BOOLEAN,
    CHECK (rx_bytes >= 0),
    CHECK (tx_bytes >= 0),
    CHECK (rx_packets >= 0),
    CHECK (tx_packets >= 0),
    CHECK (rx_errors >= 0),
    CHECK (tx_errors >= 0),
    CHECK (rx_dropped >= 0),
    CHECK (tx_dropped >= 0)
);

CREATE INDEX IF NOT EXISTS idx_network_interfaces_last_seen_at
    ON network_interfaces(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_metrics_interface_collected_at
    ON network_metrics(interface_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_metrics_collected_at
    ON network_metrics(collected_at DESC);

ALTER TABLE network_interfaces
    ADD COLUMN IF NOT EXISTS is_admin_up BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS carrier BOOLEAN;

ALTER TABLE network_metrics
    ADD COLUMN IF NOT EXISTS is_admin_up BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS carrier BOOLEAN;

CREATE TABLE IF NOT EXISTS network_incidents (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
        'interface_down', 'traffic_spike', 'high_traffic', 'packet_errors', 'packet_drops'
    )),
    interface_id INTEGER NOT NULL REFERENCES network_interfaces(id) ON DELETE RESTRICT,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    description TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by INTEGER,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((status = 'resolved') = (resolved_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_network_incidents_active_identity
    ON network_incidents(event_type, interface_id)
    WHERE status <> 'resolved';

CREATE INDEX IF NOT EXISTS idx_network_incidents_status_opened
    ON network_incidents(status, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_incidents_type_opened
    ON network_incidents(event_type, opened_at DESC);

CREATE TABLE IF NOT EXISTS network_anomaly_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
