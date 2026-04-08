#!/bin/sh
set -eu

APP_DOMAIN="${APP_DOMAIN:-localhost}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"
TLS_CERT_PATH="${TLS_CERT_PATH:-/etc/nginx/certs/fullchain.pem}"
TLS_KEY_PATH="${TLS_KEY_PATH:-/etc/nginx/certs/privkey.pem}"

export APP_DOMAIN ENABLE_HTTPS TLS_CERT_PATH TLS_KEY_PATH

if [ "$ENABLE_HTTPS" = "true" ]; then
  if [ ! -f "$TLS_CERT_PATH" ] || [ ! -f "$TLS_KEY_PATH" ]; then
    echo "HTTPS is enabled but certificate files were not found." >&2
    exit 1
  fi

  envsubst '${APP_DOMAIN} ${TLS_CERT_PATH} ${TLS_KEY_PATH}' \
    < /etc/nginx/templates/https.conf.template \
    > /etc/nginx/conf.d/default.conf
else
  envsubst '${APP_DOMAIN}' \
    < /etc/nginx/templates/http.conf.template \
    > /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
