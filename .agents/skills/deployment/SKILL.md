---
name: deployment
description: Use when preparing Dockerfiles, docker-compose, environment configuration, production hosting, retention/backup or rollout instructions.
---

# deployment

## Procedure
1. Add multi-stage `client/Dockerfile` and `server/Dockerfile` for Node 20, reproducible npm ci, minimal runtime images, non-root process and suitable healthcheck. Use `.dockerignore` and never bake `.env` or temp docs.
2. `docker-compose.yml` runs client and server, maps suitable ports, injects runtime env and mounts a dedicated persistent volume to server/data; distinguish committed seed files from runtime cache.
3. Ensure only **one** server cron process writes JSON; forbid scaling the JSON-backed service beyond one writer. Document multi-instance migration to DB/durable shared store plus external scheduler.
4. For Vercel/Netlify frontend set `VITE_API_BASE_URL`; for Render/Railway/VPS server configure persistence, node process, SMTP/TLS, HTTPS, domain CORS, health probes and runtime secrets.
5. Provide preflight: legal licence, owner-reviewed fees/privacy/terms, real payment details (never demo), external-source permissions, verified SMTP/domain, data-retention/deletion process and contact page.
6. Define backup/restore of non-PII JSON cache where needed; logs must be PII-safe; provide rollout/rollback steps and basic availability monitoring.
## Conventions
Build immutable images; no secret build args or client secrets; timezone explicit (`Asia/Karachi`), UTC logs with timestamps, secure production defaults.
## Verification
- [ ] `docker compose build` and `docker compose up` work with nonsecret demo env.
- [ ] Restart retains stats/jobs cache; uploaded temps not persisted.
- [ ] `GET /api/health` works and client talks to API.
- [ ] Production checklist blocks paid go-live pending approvals.
