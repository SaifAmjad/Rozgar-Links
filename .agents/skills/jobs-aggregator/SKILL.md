---
name: jobs-aggregator
description: Use when building the job provider interface, sample job catalog, jobs search/filter pagination, provider cache or optional scraping integration.
---

# jobs-aggregator

## Procedure
1. Define typed `JobProvider` in `server/src/providers/JobProvider.ts`, with `fetchJobs(): Promise<Job[]>` and a source/provenance descriptor.
2. Implement `ManualProvider` reading `server/data/jobs.seed.json` with ~40 explicitly fictional examples spanning six GCC countries and 12 fields; every sample has `isSample:true`, `source:"Sample listing"`, `sourceUrl:null`.
3. Build `server/src/repositories/jobsRepository.ts` with validated `jobs.cache.json`, atomic writes, timestamp, daily refresh and stale-cache fallback.
4. Implement `GET /api/jobs`: safe query schema, case-insensitive search, exact country/field filters, stable sorting, page >=1, default limit 12, cap 50, total metadata; return no fabricated source URLs.
5. Create real-source adapter **stub only** until permitted. Before activation, check domain robots.txt and applicable Terms manually; record review date, allowed endpoints, attribution terms, written approval and disallowed access. Never bypass CAPTCHAs/blocking.
6. If authorized: <=1 request per few seconds per domain, 24h+ cache, honest User-Agent, metadata only, source link and provenance. Cheerio only after legal and technical review; external API/feed preferred.
7. In `client/src/features/jobs/`, show sample/real provenance per job. Pre-fill `/apply?country=...&job=...` only with validated values; use `rel="noopener noreferrer"` for real external links.
## Verification
- [ ] 40 sample entries contain no claimed real employer openings or invented GulfTalent/NaukriGulf URLs.
- [ ] Filter/search/pagination and bad params tested.
- [ ] Provider failures retain stale labeled cache; scraping stays off by default.
- [ ] Legal disclaimer on Jobs and footer.
