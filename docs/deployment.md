# Deployment and Operations

## Release status

Rozgar Links is a **non-operational demonstration**. Do not accept real applicants, documents or
fees until every owner gate below has independent written approval. The committed payment values
are fake, all seeded jobs are labelled `Sample listing`, and generated dashboard numbers are
labelled `Indicative`.

## Container architecture

- `client/Dockerfile` builds the Vite app and serves it from an unprivileged Nginx process on port
  `8080`. Nginx serves the SPA, applies browser security headers and proxies `/api` to the server.
- `server/Dockerfile` builds the shared contracts and Express API, then runs Node as the unprivileged
  `node` user on port `4000`.
- `docker-compose.yml` exposes only the client by default. The API remains on the private Compose
  network and its `/api/health` endpoint drives the container health check.
- `server-data` persists `stats.json` and `jobs.cache.json`. Applicant fields and attachment bytes
  remain transient and must never be written to this volume.

This file-backed design supports **exactly one server replica and one cron writer**. Do not run
`docker compose up --scale server=...`. Before any multi-instance or serverless rollout, replace
JSON files with durable shared storage and move both schedules to one external scheduler.

## Local container verification

1. Copy `.env.example` to an untracked `.env` and keep all demo flags and values unchanged.
2. Run `docker compose config` and inspect the resolved non-secret settings.
3. Run `docker compose up --build -d`.
4. Check `docker compose ps`, `http://localhost:8080/healthz` and
   `http://localhost:8080/api/health`.
5. Confirm the browser shows `Sample listing`, `Indicative figures`, fake-bank warnings and draft
   legal notices.
6. Stop with `docker compose down`. Do not add `--volumes` when cache history should be retained.

Placeholder SMTP values intentionally make real submission delivery fail safely. A `201` response
must only occur after the configured SMTP server accepts the administrator email.

## Runtime configuration

Inject secrets through the hosting platform or an untracked `.env`; never bake them into either
image. `.env.example` is the authoritative key list.

- Public routing: set `CLIENT_URL` to the exact HTTPS browser origin. Keep
  `VITE_API_BASE_URL=/api` for the Compose same-origin proxy.
- Proxy handling: set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies. The Compose
  default is `1` because Nginx is the only hop.
- SMTP: provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and
  one `ADMIN_EMAIL`. Confirm TLS, sender-domain authorization and delivery monitoring before launch.
- Submission gate: keep `APPLICATION_SUBMISSION_ENABLED=false` until SMTP, privacy, legal and
  payment checks pass. Set it to `true` only in an approved deployment.
- Safety flags: `ENABLE_SCRAPING=false` and `PAYMENT_DETAILS_ARE_DEMO=true` are intentionally
  fail-closed in v1 and cannot be enabled through configuration.
- Scheduling: keep `APP_TIME_ZONE=Asia/Karachi` and a valid `STATS_CRON`, unless an approved
  operations plan specifies alternatives. The Compose container mirrors this value to its system
  `TZ`; do not try to configure reserved `TZ` directly on Vercel.

There are no database migrations in v1. The only state is validated non-PII JSON in
`server/data`.

## Production topology

Terminate HTTPS at a managed load balancer or reverse proxy, redirect HTTP to HTTPS, preserve the
same-origin `/api` route, and restrict direct access to the API. Keep Nginx and Express health
checks enabled. Confirm the CSP on representative pages after every frontend integration.

Vercel or Netlify may host the client, while Render, Railway or a VPS may host the server, only when
the server has a persistent writable volume and exactly one active cron worker. Do not deploy the
current server to an ephemeral/serverless filesystem. If client and API origins differ, set the
exact `CLIENT_URL`, configure `VITE_API_BASE_URL` at build time, and re-test CORS and uploads.

## Vercel deployment

The repository includes a single-project Vercel configuration serving the Vite frontend and Express
API from one origin. Application submission is controlled by `APPLICATION_SUBMISSION_ENABLED` and
defaults to disabled. The adapter uses process-memory caches and does not start `node-cron` or write
runtime JSON files.

1. Push the complete npm-workspace repository to GitHub.
2. Import it once in Vercel and keep the project **Root Directory** at the repository root (`.`).
3. Allow `vercel.json` to provide the Vite preset, `npm ci`, workspace build and `client/dist`
   output settings.
4. Set `CLIENT_URL` to the exact production Vercel URL or custom-domain origin. Keep
   `VITE_API_BASE_URL=/api`, `APP_TIME_ZONE=Asia/Karachi`, `MAX_FILE_MB=5`,
   `PAYMENT_DETAILS_ARE_DEMO=true` and `ENABLE_SCRAPING=false`. Do not add `NODE_ENV` manually;
   Vercel manages it, and forcing `NODE_ENV=production` during installation can omit build tools.
5. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and exactly one
   `ADMIN_EMAIL` as Vercel server environment variables. Never prefix them with `VITE_`.
6. After launch checks pass, set `APPLICATION_SUBMISSION_ENABLED=true` and redeploy. The public
   config must report `applicationSubmissionEnabled: true`.
7. Submit files no larger than 5 MiB each and confirm exactly one administrator email arrives with the
   clean summary, CV and payment screenshot. Confirm SMTP failure returns a non-201 response.

The `shared` workspace is a build dependency, not a separately deployed service. Vercel builds it
before the client and bundles the required contracts into both the browser assets and API function.
The Vercel deployment has no durable stats/jobs history: function cold starts recreate in-memory
data. The application allows uploads up to 5 MiB each, but Vercel Functions reject request bodies
above 4.5 MB before the application can process them. A Vercel deployment therefore cannot reliably
receive the largest allowed files through this multipart endpoint. Use approved private object storage
with signed browser uploads, or deploy the API to a host that supports at least the configured request
size, before relying on 5 MiB uploads in production.

## Backup and restore

Back up only `stats.json`, `jobs.cache.json` and the reviewed seed catalog. Encrypt backups, limit
operator access and define a retention period. Never back up email attachments, request bodies,
temporary upload data, SMTP credentials or logs containing applicant details.

To restore, stop the single server writer, validate the JSON against the current API contracts,
copy it into the mounted `server-data` volume, then restart and check stats/jobs endpoints. If a
cache is missing or invalid, retain the committed sample seed and let the service regenerate safe
data. Test restore procedures before public launch.

## Rollout, rollback and monitoring

1. Build immutable image tags from a passing commit; do not deploy `latest` as the only rollback
   reference.
2. Back up the non-PII JSON volume, deploy one server, then deploy the client.
3. Smoke-test health, config, taxonomy, stats, jobs, invalid upload handling and mocked SMTP failure.
4. Monitor container health, restart count, API latency, rate-limit volume, cron success and SMTP
   acceptance/failure counts. Logs must contain no PII, document bytes, transaction references or
   secrets.
5. On regression, restore the previous image tags. Restore JSON only when validated state is known
   to be corrupt; application submissions are not persisted and cannot be replayed from disk.

## Mandatory owner launch gates

Production go-live remains blocked until all items have evidence and named approval:

- [ ] Qualified legal review confirms authority and any overseas-employment/recruitment licence;
      publish the verified legal entity and licence number.
- [ ] Privacy notice, terms, consent wording, fee/refund policy and no-guarantee wording receive
      owner and legal sign-off.
- [ ] A retention/deletion schedule, subject-access procedure and verified applicant support channel
      are operational, including the SMTP provider transfer disclosure.
- [ ] Real bank/payment details, fee amount, receipt process and manual payment-verification process
      are independently approved; remove demo values only in runtime secrets/configuration.
- [ ] Any real job source has written permission, current Terms/robots review, true attribution and
      original URLs. Keep scraping disabled otherwise.
- [ ] SMTP/domain ownership, TLS, administrator mailbox access, bounce handling and confirmation
      behavior are verified without real applicant data.
- [ ] HTTPS, exact CORS origin, proxy trust, backups, restore, alerts, incident handling and PII-safe
      logging are reviewed in the production environment.
- [ ] Keyboard/screen-reader/mobile review and Lighthouse scores of at least 90 in every category are
      recorded for representative production pages.

Legal and policy text in the app remains a draft until these gates are closed. This checklist is
operational guidance, not legal advice.
