---
name: application-form-wizard
description: Use when implementing or revising the five-step React Hook Form + Zod application wizard, dependent roles, document previews or disabled-submit behavior.
---

# application-form-wizard

## Procedure
1. Create `client/src/features/application/` with FormProvider, step components Personal, Preferences, Documents, Payment, Review, progress indicator and summary errors.
2. Use a single shared Zod schema imported from `shared/src/schemas`; client `zodResolver` and server parser must agree on required fields and cross-field rules.
3. Personal: >=18, Pakistan CNIC pattern only when applicable, 6-month passport validity, phone country picker/E.164, email and required city/country.
4. Preferences: select six GCC countries or expand All Gulf, field from taxonomy, roles filtered by field, multi-select with chips/search/grouping, `Other` requires text; capture experience, education, salary range/currency, languages, relocation and extras.
5. Documents: CV required PDF/DOC/DOCX <=5 MiB; optional passport/photo. Do not serialize files or ID/passport fields into local/sessionStorage.
6. Payment: render clearly **FAKE/DEMO** bank details from `/api/config/public`, copy buttons with visible feedback, screenshot image preview, transaction reference/date and three explicit consent flags.
7. Review: readable summary, edit-step links; guard Submit by entire schema, files and consents; disabled + spinner during submission; prevent double clicks; use multipart `fields` JSON plus named files; redirect only after 201.
8. On success show exact reference and accurate `confirmationEmailSent`; on errors preserve form state and announce errors using focus/aria-live.
## Conventions
Use discriminated field types, controlled custom selects through RHF Controller, accessible labels/errors, revoke object URLs, no fake verification claim.
## Verification
- [ ] Invalid/partial state never enables Submit.
- [ ] Job field change clears incompatible roles; Other conditional rule tested.
- [ ] File required/type/size, consents, async duplicate-submit tests pass.
- [ ] Keyboard navigation and edit/review flow verified.
