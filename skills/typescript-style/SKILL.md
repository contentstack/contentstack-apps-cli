---
name: typescript-style
description: >-
  TypeScript compiler options, ESLint, and naming conventions for this repo.
  Use when editing .ts sources, fixing lint/type errors, or matching file layout.
---

# TypeScript style – Contentstack Apps CLI

## When to use

- Changing `tsconfig.json` or understanding strictness
- Fixing ESLint issues in `src/` (tests are not linted by default)
- Naming new files, classes, or exports

## Instructions

### Compiler

- Config: **`tsconfig.json`** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `composite: true`, `rootDir` `src/`, `outDir` `lib/`, `target` ES2017, `module` commonjs.
- Prefer explicit return types on exported and public functions where it helps clarity.
- Avoid `any`; use narrow types, generics, or `unknown` with guards. (Project allows some relaxed rules; see ESLint below.)

### ESLint

- Entry: **`.eslintrc`** — `@typescript-eslint/parser` with `project: "tsconfig.json"`, extends `@typescript-eslint/recommended`.
- **Ignored paths:** `lib/**/*`, `test/**/*` — lint focuses on production `src/` TypeScript.
- Notable rules: `eqeqeq` smart, `no-var`, `prefer-const`, `@typescript-eslint/no-unused-vars` (args: none).

### Naming and layout

- **Files:** kebab-case (e.g. `app-cli-base-command.ts`)
- **Classes:** PascalCase
- **Functions and methods:** camelCase
- **Constants:** `SCREAMING_SNAKE_CASE` for truly immutable module-level constants

Oclif command bases and flags: `skills/apps-cli-framework/SKILL.md`.
