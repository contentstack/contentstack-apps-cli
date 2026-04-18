---
name: dev-workflow
description: >-
  Build, test, lint, CI, and TDD expectations for Contentstack Apps CLI. Use when
  onboarding, running the project locally, or before opening a PR.
---

# Development workflow – Contentstack Apps CLI

## When to use

- Setting up the repo or running build/test/lint
- Following the team’s TDD expectations before merging
- Finding what CI runs on pull requests

## Instructions

### Commands

- **Build:** `npm run build` (cleans `lib/`, runs `tsc -b`)
- **Test:** `npm test` (Mocha on `test/**/*.test.ts`; `posttest` runs `npm run lint`)
- **Lint:** `npm run lint` — ESLint on `.ts` via `.eslintrc`
- **Coverage (unit):** `npm run test:unit:report` or `npm run test:unit:report:json` (used in CI)

### CI

- Pull requests: [`.github/workflows/unit-test.yml`](../../.github/workflows/unit-test.yml) installs dependencies, runs `npm run test:unit:report:json`, and publishes test and coverage reports (Node 22.x on `ubuntu-latest`).

### TDD

1. **Red** — Add one failing test that describes the desired behavior.
2. **Green** — Implement the smallest change to pass.
3. **Refactor** — Improve structure; keep tests green.

Do not commit `describe.only`, `it.only`, or `test.skip` — tests run with `--forbid-only`.

### Branches and PRs

Follow your team’s branch and review conventions; keep changes focused and ensure `npm test` (including lint) passes before pushing.

### TypeScript and style detail

For strictness, ESLint, and naming, use `skills/typescript-style/SKILL.md`.
