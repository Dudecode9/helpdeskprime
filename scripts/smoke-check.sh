#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"

assert_endpoint() {
  local url="$1"
  local name="$2"

  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "$url")"

  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "[FAIL] $name => $url returned $status" >&2
    exit 1
  fi

  echo "[PASS] $name => $url"
}

assert_endpoint "$BASE_URL/" "Frontend root"
assert_endpoint "$BASE_URL/api" "API root"
assert_endpoint "$BASE_URL/api/health" "API health"
assert_endpoint "$BASE_URL/api/v1" "API v1 root"
assert_endpoint "$BASE_URL/api/v1/health" "API v1 health"
