# Reverse Proxy Setup

The frontend container now uses nginx as a reverse proxy and SPA host.

## What changed

- Static frontend assets are built inside the Docker image
- nginx serves the React app
- nginx proxies `/api/*` requests to the backend container
- frontend API calls default to same-origin requests

## Result

Users can access:

- `http://localhost/` for the frontend
- `http://localhost/api/health` through nginx proxy

## Why this matters

- one origin for frontend and API
- easier cookie handling
- cleaner path to HTTPS
- fewer local CORS and deployment edge cases

## Next HTTPS step

HTTPS mode is now prepared through the nginx template system.

To enable it:

1. Put certificates into `infra/certs/`
   - `fullchain.pem`
   - `privkey.pem`
2. Use production environment values
   - `ENABLE_HTTPS=true`
   - `APP_DOMAIN=your-domain.example`
3. Start with:

```powershell
docker compose -f docker-compose.yml -f docker-compose.production.yml up --build -d
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-production.ps1
```
