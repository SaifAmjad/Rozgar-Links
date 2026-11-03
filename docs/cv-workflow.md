# Conditional CV applications and official issuance

This supersedes the older wizard specification. It is a demonstration until the owner
approves legal/privacy/fee arrangements, SMTP and real payment details. Submissions default
to disabled; payment details remain demo-only. Nothing here activates collection.

## Applicant journeys

| Step        | Common / new CV                                                                               | Returning applicant                                                |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Personal    | First name, last name, optional gender, email, Pakistani WhatsApp number, job field           | Same                                                               |
| Preferences | One or more GCC countries / All Gulf; one to three unique occupations                         | Same                                                               |
| CV Status   | Select **No, I need a new CV**; no CV upload                                                  | Select **Yes**; upload original official PDF and pass verification |
| Payment     | Configured CV preparation fee (default PKR 250); required JPEG/PNG screenshot                 | Skipped entirely                                                   |
| Review      | Details, selected occupations, CV preparation request, fee, screenshot awaiting manual review | Details, occupations, verified CV reference, PKR 0; no screenshot  |

CNIC, DOB, current city, passport, experience and transaction-reference inputs are absent.
Applicant state and files live only in memory. Changing journeys clears both uploads,
verification state and screenshot previews; in-flight verification is aborted. Submit is
single-flight in the browser. SMTP errors preserve current state for retry.

### One successful submission per browser

After a confirmed successful response, the frontend stores only
`rozgar-links-application-submitted=true` in localStorage. Later visits to `/apply` show
“Application already submitted” instead of the form. This applies to both CV journeys,
including returning applicants, and has no automatic expiry. No names, contact details,
references or uploaded files are saved. Failed submissions do not create this marker.

Open tabs synchronize through storage events and recheck on focus/pageshow. Where Web Locks
are supported, submissions from cooperating tabs are serialized and the marker is checked
again inside the lock. Browsers without Web Locks have best-effort cross-tab prevention only.
Storage must be writable before submitting. If it becomes unwritable after the API accepts
the request, the success is still shown rather than falsely reporting an email failure.

This is a browser UX restriction, not server-side identity enforcement: it is scoped to the
same browser profile and site origin. Clearing storage, using private mode/another profile or
browser, or calling the API directly can bypass it. Shared-browser users also share the lock.
There is no database-backed uniqueness or cross-device enforcement, and no new applicant
confirmation email is sent. Existing backend validation and rate limits remain unchanged.

The final server submission requires exactly the relevant attachment and rejects the other.
The strict shared schema rejects frontend verification flags and arbitrary reference/fee fields.
Returning applicants' actual attachment is verified again before sending email. Only SMTP
acceptance produces a 201; no applicant, CC or BCC email is sent. Each accepted request has
one admin message with one relevant attachment. A screenshot is never verified payment.

## Occupations: one catalog and an explicit mapping

`shared/occupations.seed.json` is the canonical 64-occupation base catalog for both directory
and application validation. It moved from `server/data/occupations.seed.json` to avoid two
diverging copies. The ManualProvider and Vercel adapter use its shared export. Directory
behavior, bilingual labels, salary data, country samples, filters and pagination are preserved.

`shared/src/occupations.ts` maps the twelve taxonomy fields to reviewed occupation IDs:

| Taxonomy field         | Occupation number suffixes                       |
| ---------------------- | ------------------------------------------------ |
| construction           | 001–020, 051, 053, 054, 057                      |
| hospitality            | 032–038                                          |
| healthcare             | 058–060                                          |
| information-technology | 061–064                                          |
| oil-and-gas            | 012, 018–020, 052, 055                           |
| logistics              | 021, 024, 026, 027, 047                          |
| retail                 | 040–044                                          |
| drivers-and-transport  | 021–031                                          |
| security               | 039                                              |
| engineering            | 051–057                                          |
| administration         | 045, 046, 048–050                                |
| education              | 065-072 (application-only education occupations) |

The directory category of security guard 039 is hospitality, but application mapping assigns
it to security, not hospitality. Shared validation checks existence, active status, field
compatibility, uniqueness and count. Application choices combine the 64 directory entries with
eight curated education roles from `shared/applicationOccupations.json`. These additional roles
are application preferences only: no vacancies, salary estimates or country availability are
invented, and the public Jobs directory is unchanged. All 72 application choices are active;
if deactivation is introduced later, update this canonical shared normalization as well.
Every current taxonomy field now has related application occupations. Step 2 names the field
selected in step 1 above its occupation list. Country preferences remain independent of occupation selection: random sample
country associations are not real eligibility requirements.

## Verification design and guarantees

Admin issuance uses `pdf-lib` to parse an unsigned PDF and append a visible issuance page.
The human-readable reference has the format `RL-CV-YYYY-XXXXXXXXXXXX`, using twelve random
characters. It is an identifier, not an authentication credential. Uniqueness is probabilistic;
there is no database to enforce global uniqueness or keep an issuance ledger.

The final serialized PDF, including the visible page, is hashed with SHA-256. A strict JSON
payload contains only version, fixed purpose, reference, UTC issuance time and the hash.
It contains no applicant PII. The base64url payload is authenticated with HMAC-SHA256 using
a dedicated server-side 32-byte key and a domain-separated signing context. The envelope
is appended as a bounded terminal PDF comment after EOF. It is not a standard certificate
signature displayed by Acrobat, nor is it an identity-verification certificate.

Verification requires the exact terminal envelope, canonical signature encoding, a supported
payload/version/purpose, valid issuance time, a timing-safe HMAC comparison, matching content
hash, and PDF content inspection. Nested envelopes and unexpected trailing bytes are rejected.
Moving a valid token into another PDF or modifying any covered PDF byte fails verification.

The guarantee is: **the covered document bytes were issued by someone holding the configured
key and have not changed**. It does not prove the uploader owns that CV, prove the applicant's
identity, guarantee factual accuracy, or detect that an unchanged official CV was shared.
There is no account ownership check, database-backed revocation, issuance history, payment
ledger or durable duplicate-submission protection. Do not claim any of these capabilities.

Normal download/copy/upload must preserve bytes. Editing, optimizing, adding annotations,
printing to PDF, or re-saving can invalidate verification even when the visible CV looks the
same. Deliver the issued original as a file attachment/document, not as an image or converted
PDF. No metadata/text-only fallback is accepted.

PDF parsing is confined to the trusted offline admin workflow. The public API performs
bounded upload/content checks and cryptographic verification; it does not render or execute
uploaded PDFs. Cryptographic issuance is not malware scanning. Administrators must review
the source PDF before issuance and use an approved document-handling process.

## Admin setup and issuance

1. Install dependencies and build shared contracts from the repository root:

   ```powershell
   npm.cmd ci
   npm.cmd run build --workspace @rozgar-links/shared
   ```

2. Generate a dedicated random key using a trusted secret manager or Node's
   `crypto.randomBytes(32).toString('hex')`. Store it as `CV_SIGNING_SECRET` in the admin
   environment and in the API's secret environment. Never commit it, put it in a `VITE_`
   variable, send it to applicants or reuse the SMTP password as the key. The example
   environment file intentionally leaves the value blank. An absent key makes verification
   fail closed with a safe 503; new-CV requests do not require a signing key.

3. Review the application and screenshot manually. In demo mode use only synthetic data;
   do not collect payments. For approved operations, prepare the completed CV outside the app.

4. Run the CLI from the root with absolute private file paths:

   ```powershell
   npm.cmd run cv:issue --workspace @rozgar-links/server -- "C:\Private\completed.pdf" "C:\Private\official.pdf"
   ```

   `tsx` is required by this developer CLI. Alternatively, after building the server, use:

   ```powershell
   node server/dist/admin/issueCv.js "C:\Private\completed.pdf" "C:\Private\official.pdf"
   ```

   The CLI requires an unsigned PDF with 1–100 pages, enforces the smaller of 5 MiB and the
   server upload limit, adds the reference page, signs and self-verifies the output. It writes
   only the explicitly requested private output, refuses overwrite, and never logs document
   content, applicant details, secrets or paths. Keep private PDFs outside the repository.
   Runtime permissions request 0600; on Windows also protect the directory with suitable ACLs.

5. Inspect the issued reference page and deliver the original file through the approved
   private channel. Do not re-save the issued result. The API itself never generates a CV,
   retains a document or sends applicant email.

### Legacy CVs and key rotation

For a legacy unsigned CV, manually review it and run the same CLI to issue a new official
copy. For an already signed CV needing edits or reissuance, use the original unsigned source
or a reviewed fresh PDF export; nested signing is refused. Legacy references or logos alone
never waive payment. If the signing key changes, old-key CVs will fail: this version has one
key and no rotation keyring. Retain the key securely or plan an approved reissuance process.
Loss/compromise of the key requires an operational response; no individual revocation exists.

## API and configuration

`POST /api/cv/verify`: multipart `cv` only, PDF <= configured limit (frontend <=5 MiB).
Rate limited to 20 attempts/IP/hour per process; no PII/document logs. Successful responses
have `Cache-Control: no-store` and either `{valid:true,cvReference}` or
`{valid:false,message}`. Bad multipart/content returns 400/413; rate limit 429; missing key 503.

`POST /api/applications`: multipart `fields` JSON, optional empty `website` honeypot, and
exactly `cv` for `existing_rozgar_cv` or `paymentScreenshot` for `new_cv_required`. Common
fields: firstName, lastName, optional gender, email, phone, field, countries, selectedJobIds,
cvPathType. Payment amount and CV verification are always server-derived.

The fee comes from validated `SERVICE_FEE_AMOUNT` (default 250) and `SERVICE_FEE_CURRENCY`
(PKR only) through `/api/config/public`, and is reused in the admin email. Existing deployments
with an old environment override must change that amount to 250 to adopt the new price.
Do not set the fee to zero to simulate returning applicants; the verified journey waives it.

Safety defaults remain `APPLICATION_SUBMISSION_ENABLED=false`,
`PAYMENT_DETAILS_ARE_DEMO=true`, `ENABLE_SCRAPING=false`. The latter two remain fail-closed
schema constraints. Real payment activation requires explicit approval and a separately
reviewed change; this redesign does not activate it.

## Docker and Vercel

Both verification and submission use memory uploads and Node crypto. Set the same private
signing key in the issuer and deployed API. Compose injects it at runtime, never during image
build. Run issuance on a private admin machine, not through a public HTTP issuance endpoint.
The production Node image includes the built CLI for deliberate offline use, but runtime
application processing still writes no applicant files.

The single-process Docker server retains only non-PII stats/jobs JSON. Vercel uses memory
repositories and process-local rate limits, so limits are best-effort across cold starts and
instances. The deployment notes document a 4.5 MB function request-body ceiling, below the
5 MiB file allowance. Each journey now uploads one file, but large files can still exceed that
ceiling before Express runs. Use an approved capable API host or design private signed
uploads before relying on the full limit in production. Recheck host limits before launch.

## Implementation references

- [Node crypto HMAC, hashes and timing-safe comparison](https://nodejs.org/api/crypto.html)
- [pdf-lib PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument)

Automated verification results are recorded in the final implementation report. Manual
browser/screen-reader, production SMTP, container and deployment acceptance remain separate
checks; passing component tests is not a claim of production readiness.
