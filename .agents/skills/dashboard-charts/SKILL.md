---
name: dashboard-charts
description: Use when implementing home summary cards, Recharts country/industry/trend views, dashboard loading states or data provenance labels.
---

# dashboard-charts

## Procedure
1. Create `client/src/features/dashboard/` components: SummaryCards, CountryChart, FieldChart, TrendChart and DashboardSection.
2. Fetch only `/api/stats` via Axios typed API functions; parse or safely format values; don't invent stats in UI.
3. Lazy-load heavy chart components with suspense skeleton; give charts descriptive titles, visible legends, text/table alternative and accessible axis labels.
4. Cards show totalOpenings, countriesCount derived from nonzero country entries, newToday, lastUpdated localized date/time with timezone label.
5. Render empty, loading, stale and error states. If `provenance=estimated`, display `Indicative figures, updated daily` near every relevant dashboard region.
6. Line chart uses ascending last7Days and matches history totals; handle zero/null data without crashing.
## Conventions
Keep numerical formatting separate from fetching; ensure chart colors meet contrast; zero values are valid; never say “live official openings” for estimated data.
## Verification
- [ ] All three charts and four summary cards use same API response.
- [ ] Estimated/stale labels visible, including mobile.
- [ ] Empty API/500 handling and chart accessibility tested.
- [ ] Lazy loading and responsive chart overflow verified.
