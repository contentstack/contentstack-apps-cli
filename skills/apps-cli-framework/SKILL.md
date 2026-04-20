---
name: apps-cli-framework
description: >-
  Oclif command structure for Contentstack Apps CLI using BaseCommand,
  AppCLIBaseCommand, @contentstack/cli-command, and @contentstack/cli-utilities.
  Use when adding flags, init/SDK setup, logging, or organizing command code.
---

# Apps CLI framework – Contentstack Apps CLI

## When to use

- Adding or refactoring oclif commands under `src/commands/`
- Extending `BaseCommand` or `AppCLIBaseCommand`, flags, or shared init
- User-facing strings, logging, and errors

## Instructions

### Class hierarchy

- **`BaseCommand`** (`src/base-command.ts`) — Extends `@contentstack/cli-command` `Command`. Centralizes `init`, `parse`, shared **flags** (`org`, `yes`), logger, `managementSdk` / `marketplaceAppSdk`, region/auth validation, and `messages` / `$t`.
- **`AppCLIBaseCommand`** (`src/app-cli-base-command.ts`) — For app-manifest workflows: loads `manifestData` from the default app JSON path after `super.init()`.

New app-facing commands should extend the appropriate base and call `await super.init()` first.

### Command responsibilities

- **CLI layer**: flag definitions, prompts via `cliux`, progress via `this.log` / logger, user errors via `this.error` / framework patterns.
- **Business logic**: prefer `src/util/`, `src/factories/`, `src/strategies/` over large `run()` methods.

### Flags and parse

- Add static `flags` on the command class; inherit `baseFlags` from `BaseCommand` where org/skip-confirmation apply.
- Parse runs in `BaseCommand.init`; use `this.flags` / `this.args` after `init`.

### Copy and i18n

- Use **`messages`** and **`$t`** from `src/messages` for user-visible strings consistent with the rest of the CLI.

### Errors

- `BaseCommand.catch` handles some framework errors; prefer consistent, actionable messages for users.
