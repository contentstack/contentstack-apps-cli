---
name: code-review
description: >-
  PR-style review checklist for this CLI (tests, oclif, security, mocks). Use
  when reviewing a change or preparing a PR for merge.
---

# Code review – Contentstack Apps CLI

## When to use

- Reviewing a pull request or local branch before merge
- Self-reviewing a diff before push

## Instructions

### Correctness and UX

- [ ] Command behavior matches flags and prompts; edge cases handled
- [ ] User-facing strings use `messages` / `$t` where appropriate
- [ ] Logging uses project logger / `this.log` patterns, not ad hoc `console` unless intentional

### Tests

- [ ] New or changed behavior covered (success and failure where relevant)
- [ ] No committed `describe.only` / `it.only` / `test.skip` (`--forbid-only`)
- [ ] External I/O mocked (sinon + nock); no real API calls
- [ ] `nock.cleanAll()` and sandbox `restore()` in `afterEach` where used

### TypeScript and style

- [ ] Avoid unnecessary `any`; align with strict TS
- [ ] Follow existing naming (kebab-case files, PascalCase classes)

### Security

- [ ] No secrets, tokens, or internal URLs committed
- [ ] Auth continues to flow through `configHandler` / stubs in tests
