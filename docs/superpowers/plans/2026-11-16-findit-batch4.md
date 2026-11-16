# FindIt Batch 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. No subagents/commits or SQL execution authorized; track checkboxes below.

**Goal:** Optional validated photo for LOST/FOUND with private Storage and per-request image access.

**Architecture:** Existing SSR action uploads random owner-path file before report insert; private bucket RLS restricts object operations; endpoint loads report by UUID and fetches its attached object. Shared image renderer displays route or placeholder. Existing matching scoring remains unchanged.

**Tech Stack:** Next.js 16, Supabase SSR/Storage, TypeScript, node:test, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-16-findit-batch4-photo-design.md` and user's audited metadata.

## Global Constraints

- No SQL execution, commit, deployment, service-role key, or report policy replacement. No UPDATE grant except status. Owner-only orphan cleanup.
- Exactly one optional image, 3*1024*1024 bytes, JPEG/PNG/WebP validated server-side including magic bytes; no change to scoring.

## Review Focus

- Forged MIME/extension/bytes, empty file and multiple files reject before Storage.
- Upload then report INSERT fails: delete only this new unlinked owner object; unknown INSERT outcome must not delete possible linked object.
- Anon archived request returns 404 with no cache; owner archived succeeds, stranger cannot read.
- Storage direct API and DB insert cannot attach another owner's path; no UPDATE policy or privilege expansion.
- Image optimizer must not cache a private response; broken images degrade to placeholder.

## Task 1: validation and schema contract

**Files:** `src/lib/report-image.ts`, `.test.ts`, `src/lib/reports.ts`, `src/lib/supabase/database.ts`, `next.config.ts`.

- [x] Write RED tests for file MIME/extension/signature/size, zero and multi-file; unique owner-path and nullable reports.
- [x] Implement validator and config with minimal interfaces; run tests GREEN.
- [x] Write migration under `supabase/pending/` with audited column grants, bucket settings and scoped INSERT/SELECT/DELETE policies; inspect statically, never execute.

## Task 2: secure server flow

**Files:** `src/app/reports/actions.ts`, `src/app/api/report-image/[id]/route.ts`, `src/lib/reports-query.ts`, `src/lib/reports-data.ts`, corresponding tests.

- [x] Test endpoint authorization pure predicate and query columns; RED then GREEN.
- [x] Implement action upload + failed-insert cleanup + uncertain-result preservation; endpoint only accepts UUID, reads report under RLS and serves private bytes no-store.
- [x] Verify unit tests and typecheck.

## Task 3: photo UI and docs

**Files:** `src/components/report-form.tsx`, `src/components/report-image.tsx`, `src/components/item-card.tsx`, `src/app/barang/[id]/page.tsx`, `src/components/match-recommendations.tsx`, `README.md`.

- [x] Add preview/reset accessible input, shared image/placeholder with fallback, photo in three views without altering score.
- [x] Document migration approval gate, Storage private/owner rules, error/orphan limits and testing prerequisites.
- [x] Run `npm test`, lint, typecheck, build; no live upload without approved migration.

## Ledger

- Baseline 31/31 tests green. Existing branch has no initial commit and user forbids commits; work in current checkout to preserve untracked Batch 1–3.
- Preflight: action consumes validator/Report type; endpoint consumes report.image_path; UI consumes image presence by report ID; matching candidates select image_path but pure scoring stays unchanged.
- Ruling: Storage SELECT uses operation-aware `object.get_authenticated` and orphan-only DELETE operations; otherwise public reads could enumerate object names. SQL checks helper availability and audited RLS/grants before any change; if target lacks helpers it fails closed and requires review.
- Ruling: migration is deliberately not rerunnable without review (constraint/bucket/policies already exist after first application) rather than silently accepting a changed permission baseline.
- Ruling: `reports` already has table-level SELECT for anon, so path column may be read via REST for public ACTIVE reports; path is not an authorization credential and no app UI exposes it. Storage SELECT still checks ACTIVE/owner and denies list/sign operations. Removing path from REST would require replacing existing SELECT grants or a new security-definer API, outside this minimal authorized scope.
- Ruling: upload failure attempts owner-only orphan removal; ambiguous report INSERT result does not remove a possibly linked file. A private orphan may remain if cleanup fails; README documents this limit.
- Red/green: 15 image tests, query-contract tests, full suite 44/44 before last cleanup refinement; lint/typecheck/build passed before last refinement. Need final verification and HTTP smoke.
- Final verification: `npm test` 46/46, lint, typecheck and `npm run build` clean; built route exists at `/api/report-image/[id]`. Local production HTTP smoke: invalid/traversal and archived ID returned 404 with `private, no-store` + `nosniff`. No migration run, so no live image upload/download/owner access test possible yet. SQL read statically only; Storage policy helper availability checked fail-closed by migration itself.
- Final self-review (no subagent permitted): checked user-supplied path never enters endpoint, report RLS + explicit owner check, operation-scoped Storage SELECT avoids public listing, owner-only orphan cleanup/ambiguous insert preservation, no report UPDATE grant/policy modifications. Limitation: existing anon SELECT table grant means active report `image_path` can be read from Supabase REST even though UI hides it; path is non-secret under Storage RLS, documented for owner review.
- Security review follow-up: RLS-filtered `NOT EXISTS` could misclassify a linked hidden report as orphan. RED→GREEN static migration contract tests pin a `SECURITY DEFINER` owner-path-only predicate (`row_security=off` fail-closed) used in both cleanup policies, object `owner_id` + folder checks, and operation-aware SELECT only for `object.delete_many`. Installed `@supabase/storage-js` remove() uses `DELETE /storage/v1/object/report-images` with `prefixes`, matching Storage's `delete_many` operation. No report policy/grant changed beyond existing `INSERT(image_path)`.
- Ruling: publishable-key server and direct clients are indistinguishable at Storage RLS. Keep endpoint as only **application** route; permit direct Storage download solely for known ACTIVE/owner path (same access model). Strict exclusive network route would need new server-only credential/architecture not authorized. Document this rather than claiming exclusivity.
- Security review verified: three new SQL contract checks RED→GREEN for full-reference cleanup predicate, Storage `owner_id` plus folder, download/delete_many operation scoping. `@supabase/storage-js` remove() confirmed via installed source and fake-fetch request to call DELETE `/storage/v1/object/report-images` with `prefixes`. Fresh checks after correction for ES2017 test target: `npm test` 49/49; lint, typecheck, build green. No SQL execution; real Storage RLS semantics still need owner-approved migration and live two-account test.
