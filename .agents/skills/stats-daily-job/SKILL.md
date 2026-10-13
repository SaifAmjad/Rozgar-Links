---
name: stats-daily-job
description: Use when implementing deterministic simulated stats, daily node-cron scheduling, JSON snapshot persistence or stats API routes.
---

# stats-daily-job

## Procedure
1. Implement `server/src/services/statsGenerator.ts` with a seed derived from ISO date in configured `TZ` and a simple documented PRNG; never use `Math.random()` for persisted estimates.
2. Give six GCC countries and twelve fields realistic weight baselines. Choose deterministic daily total with bounded variation; allocate integer buckets via largest-remainder or equivalent so both distributions independently sum exactly to total.
3. Create seven-day deterministic history per date; calculate `newToday` consistently, nonnegative and not exceeding total. Add provenance `estimated`, `lastUpdated`, and snapshot date.
4. Implement `server/src/repositories/statsRepository.ts` with safe JSON read, schema validation, atomic temp write and rename, one-writer guard and stale fallback.
5. `server/src/jobs/statsCron.ts`: `STATS_CRON` default `5 0 * * *` in `Asia/Karachi`; on boot generate only if today's snapshot missing. One scheduler per deployment.
6. Routes `GET /api/stats` and `GET /api/stats/history?days=7` (bounds 1–30). Never mix unauthorized source figures with generated official-looking numbers.
## Conventions
No global PRNG state; timezone-aware dates; injectable clock/repository for tests; strict response Zod schemas; no snapshot overwrite on failed generation.
## Verification
- [ ] Same date produces same response across restarts/timezones when TZ held fixed.
- [ ] Different dates plausibly vary; sums exact; all values bounded.
- [ ] Midnight Asia/Karachi, restart, corrupted JSON, stale fallback tested.
- [ ] No duplicate cron jobs or concurrent file corruptions.
