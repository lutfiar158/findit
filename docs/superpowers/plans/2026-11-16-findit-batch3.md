# FindIt Batch 3 Smart Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline; no subagents or commits without user approval. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic top-3 LOST↔FOUND recommendations to public ACTIVE report details.

**Architecture:** Pure scoring/ranking over a narrow, paginated Supabase candidate query; SSR detail renders a responsive recommendation section. No schema or policy modifications.

**Tech Stack:** Next.js 16, React 19, TypeScript, @supabase/ssr, node:test.

**Spec:** `docs/superpowers/specs/2026-11-16-findit-batch3-design.md`

## Global Constraints

- Preserve RLS, Cobalt Pop light UI, and existing public ACTIVE detail behavior; no new dependency, SQL execution, commit, or deployment.
- No AI, image uploads, contacts/chat, or misleading ownership probabilities.

## Review Focus

- Month/year/leap boundaries: date difference must count calendar days in UTC, not wall clock or locale.
- Late pages with better scores: top 3 must come from all filtered candidates, not only the first 100.
- Owner viewing detail: never suggest their own other report or a non-ACTIVE report accessible by owner RLS.
- Concurrently archived report: detail link may become unavailable; read queries must still enforce ACTIVE.
- Ties and percentage-like category strings: stable ID ordering and escaped filter query.

## Scope / interfaces

- Create `src/lib/matching.ts` and `src/lib/matching.test.ts`: `matchReports(source: MatchReport, candidates: MatchReport[]): Match[]`, pure and bounded top-3.
- Extend `src/lib/reports-query.ts` and its test: `queryMatchingCandidates(client, source, afterId?)` selects only matching fields, `.eq('status', 'ACTIVE')`, opposite type, anchored case-insensitive category, other id/owner, date bound, `.gt('id', afterId)` when set, `.limit(100)`.
- Extend `src/lib/reports-data.ts`: `getMatchingReports(source)` reads pages through SSR client, merges results through the pure function; return data or explicit error.
- Create `src/components/match-recommendations.tsx`; modify `src/app/barang/[id]/page.tsx` to stream a matching section below existing detail. Extend live integration test with two-account matching example, cleanup via archiving.

## Task 1 — Pure matching

- [x] Write RED unit tests for each rejection (category/type/owner/status/self/date), normalization, color/location points, all four date ranges including calendar boundary, cap at 3, deterministic ties, and empty list.
- [x] Run `node --test src/lib/matching.test.ts` and confirm expected missing module failure.
- [x] Implement `matchReports` and `MatchReport`/`Match` in `src/lib/matching.ts` using UTC calendar days; return reason labels and score.
- [x] Run `node --test src/lib/matching.test.ts` then `npm test`, expect all pass.

## Task 2 — Narrow query and detail UI

- [x] Write RED query tests asserting type/status/category/id/user/date filters, 100-row page limit and reverse date comparison.
- [x] Implement `queryMatchingCandidates` in `reports-query.ts`; run query tests GREEN.
- [x] Add `getMatchingReports` that reads filtered pages, keeps only best 3, returns explicit query error; render cards/empty/error/disclaimer on the existing detail route under Suspense.
- [x] Run typecheck, lint, test and build. Add live two-account example and run only with configured Supabase; keep test reports archived. Browser smoke for responsive layout if available.

## Ledger

- Ruling: work in existing uncommitted feature checkout; no HEAD exists and user forbids commits. User explicitly requested immediate implementation, so no design/plan approval pause.
- Pre-flight: task 2 consumes task 1's `MatchReport` and `matchReports`; detail route consumes reports-data, all via request-scoped SSR client. No mock data, no RLS changes.
- Task 1 complete: RED missing matching.ts; 10 matching tests GREEN; full suite 28/28. No dependency or SQL change.
- Task 2: RED missing query export; query tests GREEN. Ruling: anchored `imatch` + escaped regex replaces exact `ilike` so padded/case-insensitive categories are not dropped by SQL; read-only remote regex probe accepted. Ruling: cursor by ID replaces offset paging to avoid skipped pages when rows change and expensive deep offsets; RED then GREEN query tests. UI SSR example A LOST ↔ B FOUND scored 100/100 with own FOUND excluded, passed on production detail.
- Browser check on an ACTIVE test report (read-only): 1280px layout 3 cards/3 columns; 375px layout 3 cards/1 column and 375px scroll width; disclaimer present.
- Risk: automated browser CLI embedded inside the DB-writing integration test hung twice, causing Node test timeout before cleanup. Six test reports remain ACTIVE; their temporary credentials are unavailable. Browser subprocess removed; the live test now applies network timeouts, and a later run including SSR check finished normally and archived its own reports. Need user-authorized manual archival of six orphaned test reports before deployment; do not use service role or run SQL without user approval.
- Task 2 complete: read-only live query of remaining test fixtures with final anchored regex and cursor confirmed other-owner FOUND at 100/100; matching UI on production build showed three cards at desktop 1280px and one column/no horizontal overflow at 375px, with disclaimer. Self-review (no subagent permitted): verified source/candidate RLS ACTIVE filters, stable scoring/id tie, errors vs empty; long card text now wraps. Build/unit/lint/typecheck to be repeated after final UI edit. No commit/deploy.
- Final verification after card text edit: npm test 31/31, npm run lint clean, npm run typecheck clean, npm run build successful. Six ACTIVE test fixtures from interrupted tests remain a deployment blocker pending owner-approved cleanup; no administrative database operation performed.
