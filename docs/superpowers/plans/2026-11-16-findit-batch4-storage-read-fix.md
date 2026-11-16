# FindIt Batch 4 Storage Read Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare a reviewable, reversible Storage SELECT policy correction for the confirmed `object.get_authenticated_info` lookup.

**Architecture:** A new pending SQL migration replaces only `findit_photo_read_linked`'s operation guard, retaining bucket, report, and role predicates. A separate rollback restores its original definition; no database change occurs until explicit approval.

**Tech Stack:** Supabase PostgreSQL RLS, node:test static SQL contract.

**Spec:** `docs/superpowers/specs/2026-11-16-findit-batch4-photo-design.md` plus the user's approved operation-guard correction in this conversation.

## Global Constraints

- Do not execute SQL, commit, deploy, make the bucket public, allow listing or signing, bypass RLS, or disable photos without permission.
- Keep `report-images` private; retain `ACTIVE` public / other statuses owner-only access.

## Review Focus

- Wrong project or baseline policy: fail closed before replacing its definition.
- Anon/owner GET metadata lookup must be allowed for an accessible linked report.
- Other users' non-ACTIVE photos and unlinked paths must remain denied.
- Object listing, signed URL creation, and cleanup policy must remain unchanged.
- Rollback must restore the original operation guard without affecting any other policy.

---

### Task 1: Reviewable SQL and contract

**Files:** Create `supabase/pending/20261116_batch4_storage_read_info.sql` and `supabase/pending/20261116_batch4_storage_read_info_rollback.sql`; add a contract test at `src/lib/report-image-policy-fix.test.ts`. Do not edit the already-applied Batch 4 migration.

- [x] Write a failing static contract test checking forward/rollback policy name, operation guards, unchanged bucket/report access, and no listing/signing or other DDL.
- [x] Run `node --test src/lib/report-image-policy-fix.test.ts` and confirm the missing SQL fails.
- [x] Create the two pending SQL files with explicit policy-baseline guards and a single ALTER POLICY each.
- [x] Run the focused test, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` without executing SQL.
- [x] Audit the forward and rollback files against the live policy definition and describe the known-path metadata exposure.
- [x] Stop for explicit approval of the final SQL; do not commit or deploy.

### Task 2: Deferred live verification (only after separate approval and application)

**Files:** None unless live evidence reveals a new defect.

- [ ] Verify ACTIVE anonymous 200, ARCHIVED owner 200, unrelated user/anon ARCHIVED denied, direct listing/signing denied, and upload succeeds.
- [ ] Re-run tests, lint, typecheck and build; compare live Storage operation and request IDs if GET still fails.

## Execution ledger

- Ruling: work in the current `feat/findit-stitch-ui` checkout — this repository has no commits yet and the Batch 4 files are untracked, so a new worktree would omit them; the user prohibits commits. Risk: other untracked work shares this checkout; only the three named SQL/test files and this plan are in scope.
- Baseline: `npm test` passed 53/53 before this SQL proposal.
- Task 1: RED 2 expected missing-file assertions; GREEN 2/2; full suite 55/55, lint, typecheck, and build passed. Read-only MCP SELECT confirmed the forward guard's mode, roles, and full predicate all match the live policy. Rollback guard's PostgreSQL-rendered `ARRAY[...]` form remains unverified until the forward policy exists; mismatch fails closed.
- Task 2: blocked intentionally pending explicit approval and application of the final SQL; no live change or download claim.
- Final review: self-review only (no subagent requested). Rechecked the single-policy scope, fail-closed guards, preserved bucket/report predicates and roles, and unchanged orphan/upload policies. Static checks prove the proposed text only; PostgreSQL parsing of the new predicate and rollback guard must be checked after approved application. Re-ran `npm test` 55/55, lint, typecheck, and build after tightening the contract test.
- Approved execution: MCP `apply_migration` returned success for `findit_batch4_storage_read_info` (version `20261116145104`) on the origin matching `.env.local`. Live SELECT confirms the two-operation policy, unchanged other Storage policies/private bucket, and rollback guard matches. No rollback, commit, or deployment.
- Live verification: anonymous direct ACTIVE download 200 / 170811 bytes; Next route ACTIVE 200 / 170811 JPEG bytes; anonymous ARCHIVED route 404; anonymous folder list 200 with zero visible objects; anonymous signed URL request 400 `NoSuchKey` and no URL. Edge logs confirm post-migration GET 200. Authenticated owner/other-user access and authenticated upload require test credentials/fixtures and remain untested; unit upload contracts passed but do not substitute for live upload.
- Post-apply checks: `npm test` 55/55, `npm run lint`, `npm run typecheck`, and `npm run build` passed.
