# Deployment Runbook

## 1. Local update flow

Use this when updating your local stack:

```powershell
docker compose down
docker compose up --build -d
powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1
```

## 2. Production-style deploy flow

1. Create a backup first:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

2. Verify certificates exist:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-production-certs.ps1
```

3. Start production containers:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-production.ps1
```

4. Run the production gate:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1
```

5. Manually confirm critical flows:

- frontend root opens
- admin login works
- director login works
- user ticket submission works
- director dashboard shows online users and activity logs

## 3. Rollback

If a deploy breaks the app:

1. Stop the current stack:

```powershell
docker compose down
```

2. Return to the previous known-good code revision.

3. Rebuild and start again:

```powershell
docker compose up --build -d
```

4. Run the production gate again:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1
```

## 4. Database restore

Only do this if the database contents are damaged or must be reverted.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-db.ps1 -BackupFile .\db\backups\helpdesk_backup_YYYY-MM-DD_HH-mm-ss.sql
```

After restore:

```powershell
docker compose down
docker compose up --build -d
powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1
```

## 5. Fast incident checklist

- Check `docker ps`
- Check `http://localhost/api/health`
- Check backend logs
- Run `production-gate.ps1`
- Restore database only if application recovery is not enough
