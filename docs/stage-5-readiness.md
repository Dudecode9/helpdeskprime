# Stage 5 Readiness Gate

This gate confirms the project is ready to move into the infrastructure stage.

## Run the readiness check

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\readiness-check.ps1
```

To include a real backup smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\readiness-check.ps1 -RunBackupSmokeTest
```

## What it checks

- Docker containers are running:
  - `helpdesk_db`
  - `helpdesk_backend`
  - `helpdesk_frontend`
- Backend health endpoint returns `ok`
- Required PostgreSQL tables exist
- Required PostgreSQL indexes exist
- Backup and restore scripts are present
- Backup directory exists

## Required tables

- `admins`
- `directordev`
- `tickets`
- `completed_tickets`
- `refresh_tokens`
- `audit_logs`
- `user_sessions`

## Required indexes

- `idx_tickets_email`
- `idx_tickets_created_at`
- `idx_tickets_status`
- `idx_completed_tickets_email`
- `idx_completed_tickets_completed_at`
- `idx_completed_tickets_admin_email`
- `idx_audit_logs_created_at`
- `idx_audit_logs_actor_email`
- `idx_audit_logs_event_type`
- `idx_audit_logs_status`
- `idx_user_sessions_last_seen_at`

## Pass criteria

You can move to the infrastructure stage when:

- the readiness script passes
- the health endpoint is stable
- backup creation works
- containers stay healthy after restart
