---
name: testing
description: >-
  Runs TDD and unit tests for this repo using Mocha, Chai, sinon, nock, and
  @oclif/test. Use when writing or fixing tests, mocking HTTP or cliux, or
  when the user asks about test structure, coverage, or forbid-only behavior.
---

# Testing – Contentstack Apps CLI

## When to use

- Writing or changing unit tests under `test/`
- Mocking `cliux`, filesystem, HTTP, or `configHandler`
- Debugging coverage or `--forbid-only` failures

## Instructions

### Stack

- **Runner**: Mocha (`npm test`, `npm run test:unit:report`)
- **Assertions**: Chai `expect`
- **Modules**: sinon sandboxes for stubs/spies
- **HTTP**: nock — match hosts from `configHandler.get("region")` and Developer Hub URLs (see `getDeveloperHubUrl` in source)
- **CLI**: `runCommand([...])` from `@oclif/test`

### TDD loop

1. Add or adjust a single failing test that describes desired behavior.
2. Implement the smallest change to pass.
3. Refactor; keep tests green. Do not commit `.only` or `skip` (CI uses `--forbid-only`).

### Sinon patterns

- Create a sandbox per test file or per test:

```typescript
let sandbox: sinon.SinonSandbox;
beforeEach(() => {
  sandbox = sinon.createSandbox();
});
afterEach(() => {
  sandbox.restore();
});
```

- Stub UI and side effects: `cliux.inquire`, `cliux.confirm`, `cliux.loader`, `fs.*`, `shelljs`, etc., following neighboring tests in the same command.
- Reuse **`test/unit/helpers/auth-stub-helper.ts`**: call `stubAuthentication(sandbox)` instead of copying `configHandler.get` stubs.

### Nock patterns

- Register expected HTTP calls on `region.cma`, Developer Hub base URL, or other hosts used by the command under test.
- In `afterEach`, call `nock.cleanAll()` (and restore sinon) to avoid bleed between tests.

### Success and failure

- Every behavior change should have at least one happy path and one error or guard-rail assertion (stderr, exit code, or message substring) where applicable.

### Do not

- Hit real Contentstack or Developer Hub APIs from unit tests
- Rely on real auth tokens or `.env` secrets in tests
