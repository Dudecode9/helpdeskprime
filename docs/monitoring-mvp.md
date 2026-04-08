# Monitoring MVP

This project uses a lightweight monitoring approach suitable for a small production setup.

## What it checks

- frontend root is reachable
- `/api/health` responds
- Docker containers are healthy

## Run manually

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\monitoring-mvp.ps1
```

## Output

Monitoring events are appended to:

```text
ops/monitoring/monitoring.log
```

Each line is JSON and contains:

- timestamp
- status
- message
- metadata

## Recommended usage

Run this script on a schedule using Windows Task Scheduler or another external scheduler.

Example cadence:

- every 5 minutes for a small production deployment

## Why this is enough for now

- small deployment size
- health endpoint already exists
- Docker healthchecks already exist
- structured logs already exist

This gives you a practical MVP before adopting a heavier monitoring stack.
