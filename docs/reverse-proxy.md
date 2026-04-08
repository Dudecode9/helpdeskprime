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

1. Choose where certificates come from
   - recommended on VPS: mount Let's Encrypt directly with `TLS_SOURCE_DIR=/etc/letsencrypt/live/your-domain.example`
   - local/manual fallback: put `fullchain.pem` and `privkey.pem` into `infra/certs/`
2. Use production environment values
   - `ENABLE_HTTPS=true`
   - `APP_DOMAIN=your-domain.example`
   - `TLS_SOURCE_DIR=/etc/letsencrypt/live/your-domain.example`
3. Start with:

```powershell
docker compose -f docker-compose.yml -f docker-compose.production.yml up --build -d
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-production.ps1
```

## Recommended VPS setup

For a real server with Let's Encrypt:

- obtain certificates for your domain with `certbot`
- set `TLS_SOURCE_DIR=/etc/letsencrypt/live/your-domain.example`
- keep:
  - `TLS_CERT_PATH=/etc/nginx/certs/fullchain.pem`
  - `TLS_KEY_PATH=/etc/nginx/certs/privkey.pem`

The production compose file will mount that directory into the nginx container automatically.
