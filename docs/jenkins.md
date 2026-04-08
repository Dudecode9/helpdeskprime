# Jenkins CI

This project now includes a lightweight Jenkins pipeline through [Jenkinsfile](/Users/Dude/ahelpdesk_prime/Jenkinsfile).

## What it checks

- frontend dependencies install correctly
- frontend production build succeeds
- backend entrypoints pass syntax checks
- Docker images build successfully
- the local Docker stack starts correctly
- smoke checks pass for:
  - frontend root
  - `/api`
  - `/api/health`
  - `/api/v1`
  - `/api/v1/health`
- auth smoke checks pass for:
  - admin login
  - director login
  - `/api/auth/me`
  - logout

## Jenkins prerequisites

- Jenkins agent has Docker access
- Jenkins agent has Node.js and npm
- Jenkins runs from the repository root

## Recommended job type

Use a Pipeline job pointed at the repository root so Jenkins can load `Jenkinsfile` automatically.

## Notes

- the pipeline uses `.env.example` for CI startup, not production secrets
- the pipeline is intentionally lightweight and acts as a release gate, not a full test platform
- for production deployment, keep using your VPS flow and release checks separately
