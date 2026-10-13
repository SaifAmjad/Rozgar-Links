---
name: testing-and-qa
description: Use when writing automated tests, QA plans, accessibility audits, performance checks or acceptance gates for any milestone.
---

# testing-and-qa

## Procedure
1. Maintain unit tests in each workspace via Vitest; backend route tests with Supertest and mocked transport/providers; React Testing Library for pages and wizard. Tests should run offline without real SMTP/scraping.
2. Test application schema boundaries: 17/18, passport validity by calendar months, invalid CNIC, non-Pakistan ID format, field/role matching, salary range, future payment date, consents.
3. Test upload matrix: valid signatures, MIME spoofing, DOCX container integrity, limit, unexpected/missing files and temp cleanup.
4. Test stats reproducibility/sums, date rollover, cron startup, malformed file, stale fallback, 7-day trend and source labels.
5. Test jobs filtering, pagination, source URLs, sample labels, provider failures and that scraping remains disabled.
6. Test wizard disabled Submit on every missing requirement; accessible errors, quick repeat click, SMTP failure, review edit links, success `confirmationEmailSent` conditional copy.
7. Run root `npm run lint`, `npm test`, `npm run build`; manually test 320/768/1440 px and keyboard-only navigation, Lighthouse target >=90.
## Conventions
Freeze clocks and seed data, mock network, favor behavior tests, avoid snapshots with PII. Every bug fix gets regression test.
## Verification
- [ ] Unit/component/API tests run from root on clean checkout.
- [ ] No flaky dependence on local time, emails or network.
- [ ] Lighthouse and manual a11y observations documented.
- [ ] Test outcomes documented per milestone before commit.
