# Network Anomaly Detection

## Architecture

The existing Linux collector remains the only source of network observations. It reads `/proc/net/dev`, `/sys/class/net`, and Node's `os.networkInterfaces()`; the existing scheduler persists those measurements and evaluates them with `networkAnomalyService.js`. HTTP handlers do not run collection or detection loops.

The anomaly service is deterministic and stateful. It returns newly detected transitions and the set of conditions still active. The scheduler passes those to the incident service, which persists incidents separately from tickets and audit logs. PostgreSQL enforces one active incident per event type and interface; resolved rows remain in history.

The collector includes `operstate`, administrative `IFF_UP`, and `/sys/class/net/<name>/carrier` where available. An interface that was administratively disabled is not reported as a link failure. An enabled interface with no carrier is distinguished from an interface that disappeared from the Linux interface list. Missing carrier information remains unknown rather than being treated as carrier loss.

## Detection rules

All byte rates are bytes per second. Defaults are persisted on first use and can be changed in the Settings view:

| Setting | Default | Rule |
| --- | ---: | --- |
| `trafficSpikeBytesPerSec` | 5 MiB/s | Minimum rate for a spike |
| `trafficSpikeMultiplier` | 3 | Rate must also be at least this multiple of the recent 30-sample mean; without a baseline, the minimum-rate threshold is used |
| `highTrafficBytesPerSec` | 2 MiB/s | Sustained-load rate threshold |
| `highTrafficDurationSamples` | 10 | Consecutive samples required for sustained load (normally about 10 seconds) |
| `packetErrorDelta` | 3 | Combined RX/TX error counter increase per collection interval |
| `packetDropDelta` | 5 | Combined RX/TX drop counter increase per collection interval |

Rules:

- **Interface down:** a previously known interface disappears, or an administratively enabled interface reports `down`, `lowerlayerdown`, `notpresent`, or no carrier. Administrative disablement does not itself create this incident.
- **Traffic spike:** RX or TX rate passes both the minimum rate and baseline multiplier checks.
- **High traffic:** either direction remains above the high-traffic threshold for the configured consecutive sample count. It is separate from the one-sample spike rule.
- **Packet errors / drops:** the increase between adjacent counters crosses its configured threshold. Absolute lifetime counters are not used as the trigger.
- **Counter reset or invalid counter:** a decrease, non-integer, unsafe integer, or absent counter is ignored for that interval; it cannot produce a positive errors/drops alert.

The engine retains a 30-sample in-memory rate baseline and consecutive-load count. Incident state and history are persisted. After a process restart, baseline/duration warm up from fresh samples; active persisted incidents are reconciled on the next successful scheduler cycle.

## Incident lifecycle

Statuses are `open`, `acknowledged`, and `resolved`.

- An anomaly opens one incident identified by `(event_type, interface_id)`.
- Repeated observations of an active condition do not create duplicate rows. The partial unique index is the concurrency-safe final guard.
- An administrator or director can acknowledge an active incident. Its original open time is preserved.
- When the condition is no longer active, the scheduler sets `resolved` and `resolved_at`. Acknowledged incidents can also resolve automatically.
- A later recurrence creates a new row because resolved history is retained and excluded from the active unique index.

`network_incidents` stores type, interface, severity, description, details JSON, lifecycle status and timestamps. `network_anomaly_settings` stores one JSONB settings row. `network_interfaces` and `network_metrics` continue to own interface data and measurements. Incidents are not stored as tickets or audit logs.

## API

All routes are mounted under `/api/v1/network`, and use existing cookie authentication plus `admin`/`director` role authorization:

- `GET /anomalies/current` — active incidents representing current anomalies
- `GET /incidents?status=&type=&limit=&offset=` — incident history
- `GET /incidents/:incidentId` — incident detail
- `POST /incidents/:incidentId/acknowledge` — acknowledge an active incident
- `GET /incidents/summary` — active total and counts by event type
- `GET /settings` — effective anomaly thresholds
- `PATCH /settings` — validate and save all thresholds

Invalid query, path, or settings data is rejected by the existing Zod validation middleware. Resolved incidents cannot be acknowledged.

## Database setup

Apply `db/init/02_network_monitoring.sql` to the configured HelpdeskPrime database. It creates or extends only network-specific tables and uses idempotent `CREATE ... IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` statements. For an existing Compose database, for example:

```sh
docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/init/02_network_monitoring.sql
```

Compose initialization scripts run automatically only when PostgreSQL initializes an empty data directory; existing volumes need the explicit migration command above.

## Desktop and local PostgreSQL

Electron runs the backend on `127.0.0.1`. The packaged frontend is served by a small static server bound to `127.0.0.1` on an ephemeral port, and only that exact origin is added to the existing CORS/origin allowlist. The page uses a restrictive CSP and gets the backend URL through the existing context-isolated preload bridge. The renderer retains `contextIsolation`, `nodeIntegration: false`, and sandboxing.

Electron reads the root `.env` and inherited process environment; it deliberately does not load `.env.example` as runtime configuration. That example uses `DB_HOST=postgres`, which is only resolvable inside the Compose network and was the source of `getaddrinfo ENOTFOUND postgres` when Electron previously loaded the template. In Electron only, an explicit `DB_HOST=postgres` is mapped to `127.0.0.1`, the host endpoint exposed by the repository's Compose mapping `5432:5432`. For a local Linux PostgreSQL instance, configure the actual DB name, user and password in the uncommitted root `.env` or process environment. If `DB_HOST` is omitted, the existing backend config defaults to `localhost`; no credentials are supplied by this feature.

## Frontend refresh

The protected `/network-dashboard` page is available to admins and directors from their existing workspaces. It polls the local API every 10 seconds and aborts in-flight requests and clears its timer when unmounted. It shows non-loopback interfaces by default, aggregate RX/TX, stored traffic history, anomalies, incident history/acknowledgment, and editable thresholds.

## Verification

From the repository root:

```sh
npm --prefix backend test
npm --prefix backend run check
npm --prefix frontend run build
npm run desktop:check
npm run desktop:dev
```

Unit and HTTP API tests use Linux collector data and a mocked PostgreSQL query surface. They do not prove that the configured database is reachable or that the SQL migration applies to a live database. For those checks, apply the migration, configure local DB credentials, and start Electron; the backend health endpoint requires `SELECT 1` to succeed.

## Limitations

This feature analyzes interface states and statistical characteristics of traffic counters only. It does not inspect packet contents, capture PCAP, perform DPI, or provide signature/rule-based inspection. **It is not a full IDS.** It also monitors only the local Linux host and does not discover or inspect other network devices. Thresholds are operational starting points and should be tuned for the host's network capacity and normal workload.
