# FindIt Batch 3 — Deterministic Smart Matching

User-provided specification: suggest up to three ACTIVE opposite-type reports for a public ACTIVE detail, same normalized category, different owner/id, FOUND event date >= LOST event date. Scores: category 35, equal normalized color 25, equal normalized location 25, date delta 0–1/2–3/4–7/>7 gives 15/10/5/0. Sort score desc, date distance asc, ID asc; explain why and warn this is attribute similarity, not proof or probability.

## Approach

- Chosen: pure TypeScript scoring on filtered PostgREST rows (type/status/category/opposite-owner/date), paginated by increasing ID in batches of 100 with a running top 3. Exact normalized category match uses an anchored case-insensitive PostgreSQL regex, including surrounding whitespace. Accurate top 3 without loading unrelated reports, extra table, RPC, or dependency. Use existing SSR request client and RLS.
- Rejected: DB SQL scoring/matching table (would modify schema); single arbitrary LIMIT 100 (could miss a better match); fetching whole reports table (unnecessary data/load); offset pagination (high offsets and concurrent changes can shift pages).
- UI: existing detail page and Cobalt Pop tokens; compact responsive match cards and empty/error states; no contacts, AI, or photo changes.

## Constraints

No schema/RLS change, service-role key, dependency, commit or deployment. Normalization is consistent in scoring and category filtering. No database snapshot spans all pages; a simultaneous status/category change can affect the suggestions while reading, and detail links recheck ACTIVE.
