# Cursor rules for contentstack-apps-cli

Rules in this directory load based on file context. Skills hold the long-form guidance.

## Files

| Rule | When it applies |
|------|-----------------|
| `dev-workflow.md` | Always (lightweight workflow + TDD) |
| `typescript.mdc` | TypeScript / TSX sources |
| `testing.mdc` | Test files under `test/**/*.test.ts` |
| `oclif-commands.mdc` | CLI commands and base command classes |
| `contentstack-apps.mdc` | Utils, factories, strategies, GraphQL, config, types, messages |

## Expected combinations (examples)

- Editing `src/commands/app/*.ts` — typically `dev-workflow`, `typescript`, `oclif-commands`
- Editing `test/unit/.../*.test.ts` — `dev-workflow`, `typescript`, `testing`
- Editing `src/util/*.ts` or `src/graphql/*.ts` — `dev-workflow`, `typescript`, `contentstack-apps`

## Skills

Project skills live in `.cursor/skills/<name>/SKILL.md`. Reference them in chat, for example:

- `@skills/testing`
- `@skills/apps-cli-framework`
- `@skills/contentstack-apps`

## Optional commands

Slash-style workflows (if enabled in your Cursor setup) live in `.cursor/commands/`.
