# Codex Agent Rules — Rozgar Links
1. Treat `README.md` as the complete product/acceptance contract; read it first.
2. Consult matching `.agents/skills/<name>/SKILL.md` before each task.
3. Execute only the current build-order milestone; avoid scope creep.
4. Ask before adding dependencies outside the specified stack.
5. Use TypeScript, shared Zod contracts and npm workspaces.
6. Never hard-code or commit secrets, real bank data, resumes, IDs or SMTP credentials.
7. Never log personal data, passport/CNIC values, payment evidence or document bytes.
8. Do not persist applicant PII; use private transient upload processing.
9. Validate uploads by size, allowlist and file signature; clean temp files on errors.
10. No invented partnerships, real-job claims, endorsements or original URLs.
11. Keep scraping disabled without documented permission and ToS/robots review.
12. Mark all seeded listings `Sample listing` and generated stats `Indicative`.
13. Payment bank details in the specification are FAKE demonstration values.
14. Never claim payment verified, placement guaranteed or email sent if not confirmed.
15. Follow brand tokens exactly; mobile-first and WCAG AA keyboard accessibility.
16. Apply input validation on server as well as client; escape email HTML.
17. Use strict CORS, Helmet, rate limits and safe production errors.
18. Keep public config free of SMTP secrets and other nonpublic values.
19. Keep JSON writes atomic; avoid multiple cron workers on file storage.
20. Before every milestone commit run `npm run lint`, `npm test`, `npm run build`.
21. If checks fail, fix or report blockers; never falsely mark acceptance complete.
22. Make one descriptive commit per completed milestone; don't commit partial secrets.
23. Give a concise report: changed files, checks, risks and commit SHA.
24. Do not launch payment collection until licence/legal/privacy approval.
25. If instructions conflict, prioritize user direction, security and source honesty; surface conflict.
