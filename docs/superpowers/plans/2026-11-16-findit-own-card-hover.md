# FindIt Own Card Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each own report's visual card and status area hover as one surface without changing actions.

**Architecture:** An embedded variant of `ItemCard` drops its own corner, shadow, and translation; `/laporan-saya` supplies those styles on the shared outer wrapper. Other `ItemCard` callers keep existing behavior.

**Tech Stack:** Next.js 16, React, Tailwind CSS, node:test.

**Spec:** `docs/superpowers/specs/2026-11-16-findit-own-card-hover-design.md`

## Global Constraints

- No changes to Supabase, uploads/downloads, report actions, dialog behavior, dependencies, commits, or deployment.

## Review Focus

- Hover on the status area must move the entire card, not only the visual part.
- The public browse card must retain its previous hover and rounded/shadow appearance.
- Mobile and long titles must not show a new overflow seam.
- Buttons must remain clickable, loading/error/status behavior unchanged.
- No browser claim without a logged-in fixture.

---

### Task 1: Shared hover surface

**Files:** `src/components/item-card.tsx`, `src/app/laporan-saya/page.tsx`, `src/lib/own-card-layout.test.ts`.

- [x] Write a failing check proving own cards have a single outer hover surface while default ItemCard keeps its existing hover classes.
- [x] Run `node --test src/lib/own-card-layout.test.ts` and observe the expected failure.
- [x] Add an embedded ItemCard mode and put card hover/rounding/shadow on the owner page's existing wrapper.
- [x] Run focused and full tests, lint, typecheck, build.
- [x] Browser-check if a session is available; otherwise report exactly what was blocked.
- [x] Stop without commit/deploy.

## Ledger

- Ruling: work in place on the untracked feature branch (no initial commit; user forbids commits), as in the prior FindIt plan. Existing browser session redirected `/laporan-saya` to login; screenshot and source establish the visual seam, not modal behavior.
- Task 1: static layout contract RED→GREEN; full suite 56/56, lint, typecheck, build passed. Playwright confirmed the public catalog card still has `translate: 0px -4px` on hover; authenticated owner card remains untested in browser because the test session redirects to login. The status action and image logic were not changed.
- Final review: self-review only, no subagent requested. The ItemCard embedded branch strips its own radius/shadow/hover; the owner wrapper now owns them, while the public caller still uses the default branch. Risk: geometry on the actual authenticated owner page is inferred from CSS and screenshot rather than directly measured after the fix.
