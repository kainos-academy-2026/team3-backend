---
applyTo: ".github/workflows/**"
description: "Task 1: First CI pipeline. Covers GitHub Actions basics, splitting CI into test/build jobs, Docker image build validation, and build performance optimization."
---

# Task 1: Set Up Your First CI Pipeline

## Objective

Build on the existing CI workflow (`.github/workflows/ci.yml`) so it validates code quality/tests AND proves the Docker image builds successfully, using separate jobs with a clear dependency chain.

---

## Current State (Starting Point)

This repo already has a working `ci.yml` that:
- Triggers on `push` to `main`, `pull_request` to `main`, a nightly schedule, and manual dispatch
- Checks out code, sets up Node 20, runs `npm ci`, `npm run build`, `npm run lint`, and `npm test`

This satisfies **Part A (GitHub Actions basics)** and **Part B (first workflow)** — per the task brief, skip straight to Part C.

**Part A & B are marked "No AI" in the task brief.** If you want to revisit the fundamentals (triggers, runners, reusable actions), read the official GitHub Actions docs directly rather than asking an assistant:
- https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions
- https://docs.github.com/en/actions/using-workflows/triggering-a-workflow

---

## Part C: Add Container Building

Extend the workflow to build the Docker image using the existing multi-stage `Dockerfile`. Do **not** push anywhere yet — just prove the build succeeds.

**Steps:**
1. Add a step that runs `docker build` (or `docker/build-push-action@v5` with `push: false`) against the repo root `Dockerfile`.
2. Tag the image with the Git SHA for traceability:
   ```bash
   docker build -t team3-backend:${{ github.sha }} .
   ```
3. Run this on every branch push and every pull request (not just `main`) so you get build feedback everywhere.

**Consider:**
- Build failures should fail the job clearly (default Docker exit code behaviour already does this).
- Note the build duration in the Actions UI — you'll compare this after the optimization challenge.

---

## Part D: Split Into Multiple Jobs

Refactor `ci.yml` into two jobs with a dependency:

1. **`test` job** — existing checkout/setup-node/npm ci/build/lint/test steps. Give it a readable `name:` (e.g. "Run Tests & Lint").
2. **`build` job** — the new Docker build step from Part C. Give it a readable `name:` (e.g. "Build Docker Image").

**Configure:**
- `build` job uses `needs: test` so it only runs once tests pass.
- Both jobs run on `push` (main) and `pull_request`.
- Job names should be descriptive so the PR checks list and Actions UI are easy to scan at a glance.
- Note: because `build` depends on `test`, they run sequentially by design (fail fast — don't spend runner minutes building an image for code that doesn't even pass lint/tests). True parallelism only makes sense for independent jobs (e.g. two unrelated test suites), not for this dependency chain.

---

## Challenge: Optimize Build Performance

Reduce total pipeline time without changing behaviour.

**Suggested optimizations:**
- **npm dependency caching** — use `actions/setup-node@v4`'s built-in `cache: 'npm'` option, or `actions/cache@v4` keyed on `package-lock.json` hash.
- **Docker layer caching** — use `docker/build-push-action@v5` with:
  ```yaml
  cache-from: type=gha
  cache-to: type=gha,mode=max
  ```

**Measure improvement:**
1. Note the job duration (shown in the Actions UI) for a cold run (cache miss).
2. Re-run the same workflow with no code changes and compare duration (cache hit).
3. Record both numbers — this is your "before/after" evidence for the challenge.

---

## Success Criteria

- ✅ Workflow triggers automatically on push and pull request
- ✅ `test` job runs build/lint/test and must pass before `build` starts
- ✅ `build` job builds the Docker image and tags it with the Git SHA
- ✅ Pipeline fails clearly when tests or the Docker build fail
- ✅ Job names are descriptive in the GitHub Actions UI
- ✅ Caching reduces build time on repeat runs (measured, not assumed)
- ✅ No secrets are needed yet (image isn't pushed anywhere in Task 1)
