# Private admin login and CV issuance

One environment-configured administrator can issue CVs without a database, applicant accounts,
registration, analytics, or document storage. The admin UI uses English; public English/Urdu
support and application submission behavior are preserved.

## One-time setup

Use a trusted machine and open PowerShell in the repository root. Use `npm.cmd` to avoid the
Windows `npm.ps1` execution-policy error. Install existing dependencies with `npm.cmd ci` if
needed. This feature adds no dependencies.

1. Choose a unique username and a long password stored in your password manager. Generate
   its hash interactively:

   ```powershell
   npm.cmd run admin:password --workspace @rozgar-links/server
   ```

   The password is hidden and must be confirmed. Use 14–256 characters. Never pass it as a
   shell argument or environment variable. Only the generated salted hash is printed; keep
   the hash private too. Node's asynchronous scrypt uses `N=32768, r=8, p=3`, a random
   16-byte salt, 64-byte derived key, and a 64 MiB memory bound.

2. Generate a separate admin session key:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Keep the **existing** `CV_SIGNING_SECRET` when CVs have already been issued. Changing that
   key invalidates existing official CVs. Only for a new installation with no issued CVs,
   run the random-key command again to generate a different CV signing key. Never reuse the
   session key as the CV key.

4. Set the four private server environment variables in the untracked root `.env` (or
   `server/.env` if no root file exists):

   ```dotenv
   ADMIN_USERNAME=your-chosen-username
   ADMIN_PASSWORD_HASH='paste-the-generated-scrypt-v1-hash'
   ADMIN_SESSION_SECRET=paste-the-64-hex-character-session-key
   CV_SIGNING_SECRET=retain-your-existing-64-hex-character-CV-key
   ```

   Quotes around the password hash preserve its `$` characters when Compose reads `.env`.
   In Vercel's environment-variable dashboard, paste raw values **without surrounding quotes**.
   Do not use `VITE_` for any secret. Do not commit the filled environment or print it through
   `docker compose config` in a shared terminal/transcript.

5. For local development use `NODE_ENV=development`, `CLIENT_URL=http://localhost:5173`,
   preferably `VITE_API_BASE_URL=/api`, and `npm.cmd run dev`. The existing absolute
   `http://localhost:4000/api` also works with credentialed requests from that localhost
   frontend. Keep hostname spelling consistent; do not mix localhost and 127.0.0.1.

6. For production use `NODE_ENV=production`, an exact HTTPS `CLIENT_URL`, and a same-origin
   `/api` proxy as supplied by Vercel/Nginx. Set secrets in the platform's private server
   environment and redeploy. Compose injects the three new variables at runtime; provide
   HTTPS at your reverse proxy. Production Secure cookies cannot authenticate over the
   default HTTP-only Docker demo. That demo still runs with the admin variables blank.

All three `ADMIN_*` variables blank disables admin endpoints with 503. If any are set, all
three and `CV_SIGNING_SECRET` are required. Startup rejects partial config, plaintext or
unsupported hashes, malformed/shared keys, and production HTTP `CLIENT_URL` values.

## Daily workflow: no terminal needed

1. Open `/admin/login` on your website and enter the configured username and password.
2. The protected `/admin/cv` page opens: **Issue Official Rozgar Links CV**.
3. Select the completed original **unsigned PDF**, within the displayed upload limit.
4. Click **Generate Official CV** once. The server stamps only the unique reference at the bottom right of the last page,
   signs the exact issued bytes using the existing service, and verifies its own result.
5. The success state shows the reference and **Download Official CV**. Download the original
   PDF and send it through your approved private channel to the applicant.
6. Choose another file to issue the next CV, or click **Logout**.

The output keeps the original page count and page sizes, with only a small reference such as `RL-CV-2026-XXXXXXXXXXXX` added in the last page's bottom-right margin. Leave that small area clear in the source CV. Previously issued PDFs remain verifiable; to adopt the new appearance, issue again from the original unsigned source.

Optional applicant-name entry is omitted to avoid unnecessary personal data. No upload or
issued PDF is saved by the server, and no email is sent by this feature. Download links exist
only in the current browser page and are revoked when replaced, on logout, or when leaving.
Reloading preserves a valid login, but cannot recover an undownloaded PDF.

Do not edit, optimize, print-to-PDF, or re-save the issued PDF: verification requires its exact
bytes. Returning applicants continue using the unchanged public wizard and verifier. For
edits or reissuance, use the original unsigned source; nested signatures are refused.

## Endpoints and security

| Endpoint                   | Behavior                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `POST /api/admin/login`    | Strict shared username/password validation; Origin/header checks; creates cookie session.      |
| `GET /api/admin/session`   | Returns minimal session expiry, CSRF token, upload limit; 401 without a valid session.         |
| `POST /api/admin/logout`   | Requires authentication and CSRF; expires browser cookie.                                      |
| `POST /api/admin/cv/issue` | Requires authentication and CSRF; one PDF only; returns a safe reference-named PDF attachment. |

Passwords use salted scrypt and timing-safe comparison. Unknown usernames still run the full
password check. Incorrect credentials share a generic error. No password/hash/key is returned
to the frontend. No auth token or password is placed in localStorage or sessionStorage.

Sessions are purpose-scoped signed cookies with an absolute eight-hour expiry. Production
uses `__Host-rozgar-admin` with `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, and no Domain.
Development uses `rozgar-admin` without Secure on local HTTP. Every protected request checks
signature and expiry on the backend. Signatures bind the configured username/password hash,
so credential or session-key rotation invalidates old sessions once every instance is updated.

Every admin POST requires an exact configured/platform Origin and the non-simple
`X-Admin-Request` header. Issuance/logout also require a session-bound `X-CSRF-Token` held in
React memory. The existing exact CORS allowlist now supports credentials. Frontend guards,
refresh checks, and expiry timers improve UX; backend authorization remains authoritative.

Admin responses and failures have `Cache-Control: no-store`; Helmet headers remain enabled.
No credentials, applicant information, document bytes or private paths are logged. Disable
request/response-body and cookie/header capture in hosting and reverse-proxy monitoring.

Authentication/CSRF runs before upload parsing. Only one `cv` PDF and no additional fields
are accepted. Extension, MIME, file signature, structure, 1–100 source pages, file size, and
unsigned-source status are validated. Parser errors are generic; buffers are transient.
This is not malware scanning, applicant identity verification, payment confirmation, or a
guarantee of employment.

## Stateless and deployment limitations

- Logout clears the browser cookie. **A copied cookie remains usable until expiry or
  credential/session-key rotation.** There is no persistent per-session revocation store.
  Rotate the session secret to invalidate all admin sessions without changing the CV key.
- There is no issued-document history or individual CV revocation. CV-key rotation retains
  the existing reissuance implications and should be planned separately.
- Login allows five requests/IP/15 minutes; issuance allows 20 requests/IP/hour. Counters are
  per process and best effort across Vercel cold starts or multiple instances. Before public
  production access, configure host firewall/rate limiting or network access restrictions,
  and verify trusted-proxy IP handling. No Redis/database/provider is added.
- Stateless cookies survive cold starts when all instances have matching secrets/credentials.
  Production and preview deployments should have isolated credentials and signing keys.
- Prefer the same HTTPS origin for SPA and API. Separate origins must be allowlisted and
  **same-site** for Strict cookies. Unrelated frontend/API domains are unsupported: use a
  same-origin proxy rather than weakening cookies. Platform-supplied Vercel production,
  branch and deployment origins remain supported.
- Input and issued PDFs are capped at the smaller of `MAX_FILE_MB` and 5 MiB, or **4 MiB on
  Vercel** to leave overhead beneath its documented
  [4.5 MB request/response limit](https://vercel.com/docs/functions/limitations). A nearly-full
  input can exceed the output limit after stamping; reduce the original PDF and retry.
  Public applicant upload limits are unchanged.
- Existing stats/jobs storage and cron deployment restrictions still apply separately.

## Implementation and checks

Added shared `schemas/admin.ts`; server `admin/password.ts`, `admin/session.ts`, `admin/upload.ts`,
`admin/hashPassword.ts`, `admin/issueCvFile.ts`, `routes/admin.ts`, and corresponding tests;
client `features/admin/AdminPanel.tsx`, `api.ts`, and tests. Updated server app/router/config,
the common CV issuance service, private CLI wrapper, server scripts, shared exports, `.env.example`,
Compose, and route entry points. Admin code is lazy-loaded outside the public layout; the
public language prompt remains on public routes. No dependency is added.

Both CLI and web use `services/cvIssuance.ts`; cryptography follows the unchanged HMAC/SHA-256
integrity scheme and [Node crypto APIs](https://nodejs.org/api/crypto.html).

Automated tests cover credentials, tampering, expiry, rotation, cookie settings, logout,
Origin/CSRF, rate limits, config validation, multipart validation, visible references, issued
PDF integrity, public verification/returning submission, CLI file issuance and overwrite
safety, and browser login/upload/download/logout/expiry. Run:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run build:vercel
```

Production credentials are intentionally not configured by this change. Before enabling admin
access, the owner must complete setup and verify real-browser HTTPS cookies/login/download
at mobile/desktop widths, proxy/firewall behavior, private document delivery, and recovery/key
rotation procedures. Keep all existing legal/payment/privacy/SMTP/source-permission launch
gates. This feature does not enable public submissions or payment collection. Automated
checks do not claim a deployment, production sign-in, or manual browser/container acceptance.
