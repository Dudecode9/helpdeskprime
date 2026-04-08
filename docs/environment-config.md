# Environment Configuration

## Goal

Keep local and production configuration separate without introducing unnecessary complexity.

## Local development

Use:

- `.env`

Start from:

- `.env.example`

Local defaults are intended for:

- `localhost`
- local Docker services
- HTTP mode
- non-production secrets

## Production

Use a separate environment file on the server.

Start from:

- `.env.production.example`

Production values should include:

- real domain name
- real database password
- real JWT secrets
- `NODE_ENV=production`
- `ENABLE_HTTPS=true`
- certificate paths

## Rules

- never commit a real production `.env`
- never reuse local secrets in production
- local and production database passwords may differ
- production should use a real domain and HTTPS

## Quick mapping

- `.env.example` -> template for local setup
- `.env` -> real local file
- `.env.production.example` -> template for production setup
- production server env file -> real production secrets
