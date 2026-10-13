---
name: api-security-hardening
description: Use when reviewing Express middleware, sensitive-data handling, CORS, anti-abuse, API errors or compliance safety.
---

# api-security-hardening

## Procedure
1. Add `helmet()` with compatible CSP and disable revealing technology headers. Set exact `CLIENT_URL` allowlist; reject untrusted origins for browser requests.
2. Apply `express-rate-limit` to POST applications (default 5/IP/hour) and optionally more generous read API limits. Only trust known reverse proxies for real client IP.
3. Validate every JSON/query/multipart field with shared Zod; allowlist known keys; hard cap lengths/counts; reject unknown fields and unexpected files.
4. Introduce inert honeypot field that genuine form leaves empty; respond uniformly; add optional Turnstile/reCAPTCHA hook via server secret but do not require it until configured.
5. Use HTML escaping for all email values, safe URL validation and `rel="noopener noreferrer"` for external links; no unsafe client `innerHTML`.
6. Define central error mapping for 400/413/429/502/503/500; no stack traces in production; structured logs show event type, timestamp, request ID and status only, never names/IDs/emails/passports/attachments.
7. Implement data minimization; admin SMTP is third-party processing requiring policy disclosure; verify no sensitive files written to persistent data directory.
## Verification
- [ ] Disallowed origin, rate limits, honeypot, malicious HTML, long inputs and request size tested.
- [ ] Error payloads reveal no stack or secret.
- [ ] Log tests prove no PII or attachment bytes.
- [ ] Health and public config expose no credentials.
