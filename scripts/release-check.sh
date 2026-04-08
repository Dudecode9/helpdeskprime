#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"

echo "== Frontend build =="
(
  cd frontend
  npm ci
  npm run build
)

echo "== Backend syntax check =="
(
  cd backend
  npm ci
  node --check server.js
  node --check src/app.js
)

echo "== Smoke checks =="
./scripts/smoke-check.sh "$BASE_URL"

echo "== Auth smoke checks =="
./scripts/auth-smoke-check.sh "$BASE_URL"

echo ""
echo "Release check passed."
