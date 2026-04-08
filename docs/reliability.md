# Reliability Operations

## Graceful shutdown

The backend now handles:

- `SIGINT`
- `SIGTERM`
- `uncaughtException`
- `unhandledRejection`

On shutdown it:

1. Stops accepting new HTTP connections
2. Closes the PostgreSQL pool
3. Writes structured shutdown logs

## Create a backup

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

The backup file is stored in `db/backups/`.

## Restore a backup

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-db.ps1 -BackupFile .\db\backups\helpdesk_backup_YYYY-MM-DD_HH-mm-ss.sql
```

## Notes

- Run restore only when you intend to replace the current database contents.
- Keep periodic copies of the generated `.sql` backups outside the project directory as well.
