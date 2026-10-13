---
name: project-scaffold
description: Use when creating or changing npm workspaces, TypeScript configs, base scripts, linting, folders or initial health endpoint.
---

# project-scaffold

## Procedure
1. Review README tech decisions and Build order M1. Create root npm workspaces `client`, `server`, `shared`, requiring Node 20 and npm lockfile.
2. Configure TypeScript strictly for all workspaces (no unchecked `any`), ESM consistently; share types/schemas via proper package exports, not relative cross-workspace `../../` chains.
3. Set root scripts: `dev` (parallel client/server using an approved minimal approach), `build`, `start`, `lint`, `test`; make them work from a clean checkout. If concurrency requires extra package, ask before installing.
4. Add React Router/Vite client skeleton, Express `GET /api/health`, env loading and centralized route mounting; ensure API URL works via proxy or explicit `VITE_API_BASE_URL`.
5. Add ESLint and Prettier; `.gitignore` excludes `.env`, node_modules, build, private upload/temp and runtime JSON caches. Preserve committed `server/data/jobs.seed.json`.
6. Establish directories from README; do **not** implement future milestone features during scaffold.
## Conventions
TypeScript interfaces at boundaries; `camelCase` vars, `PascalCase` React components, kebab-case skill names. No secrets in examples; typed env parser in server.
## Verification
- [ ] `npm ci` succeeds on clean clone after lockfile creation.
- [ ] Root `npm run lint`, `npm test`, `npm run build` return zero.
- [ ] `/api/health` responds 200; React app loads and router fallback works.
- [ ] One M1 commit with prescribed message.
