# FindIt test-data cleanup and Vercel readiness

> Operational plan. No commit/deploy or administrative SQL execution by the agent.

**Goal:** Verify six Batch 3 fixtures, give the owner a narrowly guarded archival statement, then report deployment prerequisites without changing data through RLS bypass.

**Inputs:** User request in this conversation; `tests/supabase-integration.test.mjs`; `docs/superpowers/plans/2026-11-16-findit-batch3.md`.

- [x] Read the six IDs with the public publishable key only; compare exact fixture naming, type, attributes, description, ACTIVE status, date, and two-owner triplets against the live test source. No ambiguous ID found.
- [x] Write `supabase/pending/20261116_archive_batch3_test_reports.sql`: exact ID + fixture title/type/description/status/date guards; change **only** `status` to `ARCHIVED`, roll back if affected count is not six. User reviews and runs it in Supabase SQL Editor; agent never runs it. Read-only safety check confirmed all six guarded titles/types and attributes against live rows.
- [x] Check local public-key configuration, production build, Supabase RLS/auth flows, public routes, README and Vercel configuration availability; distinguish local checks from inaccessible Vercel settings. Local config valid; 31/31 tests, lint, typecheck and build pass. Anon sees six ACTIVE / zero ARCHIVED, Auth settings HTTP 200 (autoconfirm on). Build on port 3017 returned public pages and matching section, anonymous protected routes redirected to login, cache private/no-store. Vercel Production env, auth domain/redirect settings and target RLS policies cannot be independently inspected from this checkout (no `.vercel` linkage or git commits).
- [ ] After owner confirms running SQL, use only anonymous/read-only queries and page checks to verify six IDs absent from public and matching; until then explicitly mark cleanup/deployment blocked.

**Risk:** SQL Editor has administrative privileges. Never run the proposed SQL on a different project without verifying the target and the six fixtures. If a guard fails, no report should remain changed. Archived reports remain available to their owners under the existing RLS.

**Pending owner action:** run the guarded SQL and confirm the administrative post-check, then request the public/Smart Matching recheck. Current public count remains six; post-archival verification cannot truthfully be completed yet. Ruling: do not perform an administrative update with lost test-owner sessions or a service-role key; keep it for the owner's SQL Editor.
