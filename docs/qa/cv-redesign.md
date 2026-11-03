# Conditional CV wizard verification

Verified during implementation on 2026-11-02 (user timezone: America/Los_Angeles).

## Completed checks

- Root `npm run lint`: passed, zero warnings.
- Root `npm test`: **148 tests in 36 files passed** (50 client, 78 server, 20 shared).
- Root `npm run build`: passed shared, client and server builds.
- `npm run build:vercel`: passed the shared build, adapter TypeScript check and frontend build.
- Built admin CLI smoke test with a synthetic PDF and an ephemeral test key: issuance,
  verification, tamper rejection and no-overwrite behavior passed. Synthetic files were removed.
- `git diff --check`: passed.

## Changed modules

- Frontend: `ApplicationWizard.tsx`, new `WizardControls.tsx`, application API/file validation,
  wizard/API tests, the how-it-works copy, new `applicationTranslations.ts`, translation
  integration and the test-only Storage fallback.
- Shared: new `occupations.ts` and mapping tests, moved `occupations.seed.json`, application
  schema/tests, new `cvVerification.ts` response contract and shared exports.
- Backend: new `cvIdentity.ts`, `cvIssuance.ts`, their tests, private `admin/issueCv.ts`, new
  `routes/cv.ts` and tests, application route/tests, multipart validation, email templates/tests,
  route mounting, ManualProvider and validated environment settings.
- Deployment/configuration: Vercel seed import, server Dockerfile, Compose, `.env.example`,
  server package scripts/dependency and npm lockfile.
- Documentation: README, deployment addendum, new CV workflow and this QA report.

Coverage includes both journeys in English and Urdu/RTL, required personal fields, absent
removed fields, country preferences, field reconciliation, three-job cap, removable selections,
payment skipping, invalid CV blocking, aborting stale verification, clearing incompatible
uploads, retry after SMTP failure, single-flight submit and disabled demo submission.

Backend coverage includes valid PDF issuance, wrong keys, missing/malformed/unsupported tokens,
changed PDF bytes, copied tokens, trailing content, upload checks, verification rate limits,
unconfigured signing, independent final-submission verification, conditional attachments,
invalid/duplicate/mismatched job IDs, one administrator recipient, correct email variants,
HTML escaping, safe SMTP rejection and the pre-existing jobs/stats/security regression tests.

The prior Node 26 language tests now pass with a test-environment-only Storage fallback when
Node shadows jsdom storage. Node still emits its experimental web-storage warning. Production
language storage behavior is unchanged.

## Dependency audit: unresolved launch blockers

`npm audit --omit=dev --json` reported **6 findings: 4 high, 2 moderate**, in existing dependencies:

- body-parser: compressed-body denial of service
  ([advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828)).
- follow-redirects: sensitive-header forwarding
  ([advisory](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p)).
- multer: request-teardown denial of service
  ([advisory](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)).
- nodemailer: address-parser recipient handling (moderate)
  ([one of the reported advisories](https://github.com/advisories/GHSA-8c8m-p3m8-cjg8)).
- qs: constrained stringify denial of service (moderate)
  ([advisory](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw)).
- zod: oversized constrained collections
  ([advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)).

The approved new pdf-lib dependency was not listed in this production audit. No automatic
`audit fix --force` or broad dependency migration was applied: the Zod advisory's suggested
fix requires a major-version migration. These findings require dependency remediation and
retesting before production. Existing bounded JSON/multipart inputs, finite token size and
rate limits remain in place; they do not constitute proof that advisories are resolved.

## Checks not claimed

No production SMTP delivery, real payment, applicant CV, live deployment, browser screenshot,
manual keyboard/screen-reader/responsive audit, Lighthouse score or Docker runtime validation
was performed for this change. Run manual checks at 320/768/1440 px for both journeys and both
languages. Confirm focus on errors, long occupation chips, tab order, file preview cleanup and
the four-step returning versus five-step new-CV indicator.

The Vercel request-body ceiling, process-local rate limits, lack of ownership/revocation/
durable idempotency and exact-byte PDF preservation requirements are documented in
[the CV workflow](../cv-workflow.md). A signing key must be provisioned separately; none was
generated into committed configuration. Owner/legal/privacy/fees approvals remain required.
