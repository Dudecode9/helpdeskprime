# Production Gate

## Minimal deployment gate

Before a production rollout, complete these checks:

1. Build and start the stack

```powershell
docker compose up --build -d
```

2. Run readiness checks

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\readiness-check.ps1
```

3. Run smoke checks

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-check.ps1
```

Or run the full gate in one command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1
```

For a fuller pre-release check that also validates frontend build, backend syntax, and auth sessions:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-check.ps1
```

4. Confirm manual critical flow

- admin login works
- director login works
- user ticket submission works
- dashboard pages load correctly
- active ticket can move to `in_progress`
- active ticket can be closed

## Production compose usage

For production-style startup with HTTPS-capable nginx:

```powershell
docker compose -f docker-compose.yml -f docker-compose.production.yml up --build -d
```

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-production.ps1
```

## Notes

- `docker-compose.production.yml` expects certificates under `infra/certs/`
- use `.env.production.example` as the base for production environment values
- required certificate filenames:
  - `infra/certs/fullchain.pem`
  - `infra/certs/privkey.pem`
- for a lightweight production monitoring loop, use `scripts/monitoring-mvp.ps1`
- the latest versioned health endpoint is `GET /api/v1/health`
- legacy `/api/...` routes remain available for backward compatibility
