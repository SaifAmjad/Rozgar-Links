---
name: email-delivery
description: Use when building Nodemailer transport, HTML application summary, admin attachments, applicant confirmation or SMTP diagnostics.
---

# email-delivery

## Procedure
1. Parse SMTP_HOST/PORT/SECURE/USER/PASS, MAIL_FROM and ADMIN_EMAIL from validated server env. Do not expose to client or commit secrets.
2. Create transport singleton in `server/src/email/transport.ts`; use secure TLS according to SMTP provider, connection timeout and graceful errors. For port 465 use `SMTP_SECURE=true`; for 587 STARTTLS if supported/required.
3. In `server/src/email/applicationEmail.ts`, render every submitted field in grouped HTML tables (personal, preferences, payment) with an HTML-escaping utility; include a plain-text fallback.
4. Subject `New Application – <Full Name> – <RefID>` with safe line-break removal and length limits. Attach validated CV, screenshot and optional documents from memory/private temp.
5. `POST /api/applications` generates server ref only after validation; send **one** admin email; return 201 only after accepted SMTP delivery. Do not claim end-to-end inbox arrival, only SMTP acceptance.
6. If `SEND_APPLICANT_CONFIRMATION=true`, optionally send separate email with reference and no sensitive details; return `confirmationEmailSent` accurately. Applicant message failure should be tracked without pretending success; define and test precise policy.
7. For Gmail use 2-Step Verification + app password **if supported by account**, not account login password; prefer dedicated transactional SMTP. Never print credentials while troubleshooting.
## Verification
- [ ] Mock SMTP: one admin message per successful request with accurate attachments.
- [ ] XSS payloads are escaped in HTML and CRLF in headers neutralized.
- [ ] Admin SMTP failure -> non-201; no fake success page.
- [ ] Confirmation toggle and failures reflected accurately.
