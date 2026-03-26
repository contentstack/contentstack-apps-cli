---
description: "Core development workflow and TDD patterns - always applied"
globs: ["**/*.ts", "**/*.js", "**/*.json"]
alwaysApply: true
---

# Development Workflow

## Quick reference

For detailed patterns, use project skills (invoke in chat when relevant):

- `@skills/testing` — Testing, TDD, Mocha, sinon, nock, `@oclif/test`
- `@skills/apps-cli-framework` — Base commands, oclif, `@contentstack/cli-utilities`
- `@skills/contentstack-apps` — Developer Hub, manifest, GraphQL, API utilities

## TDD workflow — mandatory

1. **RED** — Write one failing test
2. **GREEN** — Write minimal code to pass
3. **REFACTOR** — Improve code quality

## Critical rules

- No implementation before tests for new behavior
- Target high coverage; run `npm run test:unit:report` to measure (aim for ~80% on touched areas)
- TypeScript strict mode is enabled in `tsconfig.json`
- Do not commit `test.skip`, `describe.skip`, or `.only` (Mocha runs with `--forbid-only`)
