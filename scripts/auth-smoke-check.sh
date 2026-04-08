#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
DIRECTOR_EMAIL="${DIRECTOR_EMAIL:-director@gmail.com}"
DIRECTOR_PASSWORD="${DIRECTOR_PASSWORD:-Director123!}"

cleanup() {
  rm -f .auth-admin.cookies .auth-director.cookies
}

trap cleanup EXIT

assert_role_flow() {
  local role_name="$1"
  local login_path="$2"
  local expected_role="$3"
  local email="$4"
  local password="$5"
  local cookie_file="$6"

  curl -k -sS -f \
    -c "$cookie_file" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    "$BASE_URL$login_path" > /dev/null
  echo "[PASS] $role_name login"

  local me_response
  me_response="$(curl -k -sS -f -b "$cookie_file" "$BASE_URL/api/auth/me")"
  echo "$me_response" | grep -q "\"role\":\"$expected_role\"" || {
    echo "[FAIL] $role_name session returned unexpected role" >&2
    exit 1
  }
  echo "[PASS] $role_name /api/auth/me"

  curl -k -sS -f \
    -b "$cookie_file" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{}' \
    "$BASE_URL/api/auth/logout" > /dev/null
  echo "[PASS] $role_name logout"
}

assert_role_flow "Admin" "/api/auth/login/admin" "admin" "$ADMIN_EMAIL" "$ADMIN_PASSWORD" ".auth-admin.cookies"
assert_role_flow "Director" "/api/auth/login/director" "director" "$DIRECTOR_EMAIL" "$DIRECTOR_PASSWORD" ".auth-director.cookies"
