# Contentstack Apps CLI – Agent guide

**Universal entry point** for contributors and AI agents. Detailed conventions live in **`skills/*/SKILL.md`**.

## What this repo is

| Field | Detail |
|--------|--------|
| **Name:** | [https://github.com/contentstack/contentstack-apps-cli](https://github.com/contentstack/contentstack-apps-cli) |
| **Purpose:** | oclif-based Contentstack CLI **plugin** for Developer Hub app lifecycle: create, read, update, delete apps, install/uninstall, deploy, and related workflows. |
| **Out of scope (if any):** | The core `csdx` CLI binary and global auth UX live outside this repo; this package is the **Apps plugin** only. |

## Tech stack (at a glance)

| Area | Details |
|------|---------|
| **Language** | TypeScript, `target` ES2017, `strict: true`, `noUnusedLocals` / `noUnusedParameters`; `src/` compiles to `lib/`. Node **>= 16** (see `package.json` `engines`). |
| **Build** | `npm run build` — `tsc -b`; `clean` removes `lib/`, `tsconfig.tsbuildinfo`, `oclif.manifest.json`. Key files: `tsconfig.json`, `package.json` `oclif` block. |
| **Tests** | Mocha, `test/**/*.test.ts`; Chai, sinon, nock, `@oclif/test`. `--forbid-only` in CI. |
| **Lint / coverage** | ESLint `.eslintrc` (TypeScript ESLint; `lib/**` and `test/**` ignored). Coverage: `nyc` via `npm run test:unit:report` / `test:unit:report:json`. |
| **Other** | oclif v4; commands under `src/commands/`; shared bases `src/base-command.ts`, `src/app-cli-base-command.ts`. Published API surface is CLI commands, not a library (`src/index.ts` exports `{}`). |

## Commands (quick reference)

| Command Type | Command |
|--------------|---------|
| **Build** | `npm run build` |
| **Test** | `npm test` |
| **Lint** | `npm run lint` |

**Optional:** Unit tests with coverage — `npm run test:unit:report` (JSON report for CI: `npm run test:unit:report:json`). `npm test` runs `posttest` → `npm run lint`.

**CI:** [`.github/workflows/unit-test.yml`](.github/workflows/unit-test.yml) — on pull requests: install deps, run `npm run test:unit:report:json`, publish test and coverage reports.

## Where the documentation lives: skills

| Skill | Path | What it covers |
|-------|------|------------------|
| Development workflow | [`skills/dev-workflow/SKILL.md`](skills/dev-workflow/SKILL.md) | Branches/PR expectations, build/test/lint, TDD loop, CI |
| Contentstack Apps domain | [`skills/contentstack-apps/SKILL.md`](skills/contentstack-apps/SKILL.md) | Developer Hub, manifests, GraphQL, HTTP utilities, config, auth in tests |
| Apps CLI framework (oclif) | [`skills/apps-cli-framework/SKILL.md`](skills/apps-cli-framework/SKILL.md) | `BaseCommand`, `AppCLIBaseCommand`, flags, messages, command layout |
| Testing | [`skills/testing/SKILL.md`](skills/testing/SKILL.md) | Mocha, sinon, nock, `@oclif/test`, fixtures, forbid-only |
| Code review | [`skills/code-review/SKILL.md`](skills/code-review/SKILL.md) | PR checklist: correctness, tests, security, style |
| TypeScript style | [`skills/typescript-style/SKILL.md`](skills/typescript-style/SKILL.md) | `tsconfig.json`, ESLint, naming and file layout |

The [`skills/`](skills/) directory mirrors this table; see [`skills/README.md`](skills/README.md) for how the folder layout works.

## Using Cursor (optional)

If you use **Cursor**, [`.cursor/rules/README.md`](.cursor/rules/README.md) only points to **`AGENTS.md`** — same docs as everyone else.
