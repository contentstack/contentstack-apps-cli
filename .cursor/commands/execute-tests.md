---
name: execute-tests
description: Run tests by scope using this package's npm scripts and Mocha paths
---

# Execute tests

- **All tests** — `npm test` (Mocha: `test/**/*.test.ts`, `--forbid-only`)
- **Unit tests with coverage** — `npm run test:unit:report`
- **Unit JSON report** — `npm run test:unit:report:json`
- **Single file** — `npx mocha --forbid-only "test/unit/commands/app/delete.test.ts"` (adjust path)
- **Directory** — `npx mocha --forbid-only "test/unit/commands/app/**/*.test.ts"`

After changes, run `npm run lint` if needed (`posttest` runs lint after `npm test`).
