---
name: contentstack-apps
description: >-
  Contentstack Developer Hub apps, manifests, GraphQL, and HTTP helpers for this
  CLI. Use when changing API calls, manifest handling, regions, or shared app
  types.
---

# Contentstack Apps domain – Contentstack Apps CLI

## When to use

- Changing Developer Hub or CMA-related HTTP behavior
- Working with app manifests, config, or GraphQL queries
- Stubbing region/auth in tests for network code

## Instructions

### Configuration

- **`src/config/index.ts`** — Default filenames, Developer Hub base URL defaults, and related constants consumed by commands and `BaseCommand`.

### Manifest and app data

- App manifest shape and typings live under **`src/types/`** (e.g. `AppManifest`).
- Commands that need on-disk manifest use **`AppCLIBaseCommand`** and `config.defaultAppFileName`.

### HTTP and APIs

- **`src/util/api-request-handler.ts`** — Shared request/error handling patterns; prefer extending these utilities over raw `fetch` scattered in commands.
- **`src/util/inquirer.ts`** — `getDeveloperHubUrl()` and related helpers; tests often nock against the derived host.

### GraphQL

- Queries and fragments belong in **`src/graphql/queries.ts`** (or sibling files if the folder grows). Keep query strings aligned with Developer Hub expectations used by install/deploy/update flows.

### Auth and region in tests

- Production code expects region and auth from `@contentstack/cli-utilities` `configHandler`.
- Unit tests must stub these (see `stubAuthentication` in `test/unit/helpers/auth-stub-helper.ts`); never require real credentials.

### Rate limits and retries

- If adding new network calls, follow existing patterns for errors and retries in utilities rather than blocking the CLI without feedback.
