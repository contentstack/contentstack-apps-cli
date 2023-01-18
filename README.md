<!-- Insert Nodejs CI here -->
<!-- Insert Apps CLI version here -->

# contentstack-apps-cli

## Description

This is a plugin for [Contentstack's](https://www.contentstack.com/) CLI.
It allows you to interact and work with Contentstack Apps.

## Why use this plugin

1. The `csdx app:create` command allows you to get started with a sample Contentstack application. It spawns a copy of the [Contentstack App boilerplate](https://github.com/contentstack/marketplace-app-boilerplate) on your system and registers a sample app in the organization whose uid is provided.

## How to install this plugin

```shell
$ csdx plugins:install contentstack-apps-cli
```

## How to use this plugin

This plugin requires you to be authenticated using [csdx auth:login](https://www.contentstack.com/docs/developers/cli/authenticate-with-the-cli/).

# Commands

<!-- add commands here -->

- [`csdx app:create`](#csdx-appcreate)

## `csdx app:create`

create an sample app in local using Contentstack App boilerplate and register it on Developer Hub.

```
USAGE
  $ csdx app:create <app_name>

OPTIONS
  -t, --app-type      Type of the App (stack / organization)
  -o, --org           Uid of the Organization on which app needs to be registered
  -i --interactive    Run command in interactive mode (TBD)

EXAMPLES
  $ csdx app:create "sample app" -o "xxxxxxxxxxxxxxxxxxx" -t "stack"
  $ csdx app:create "sample app" -o "xxxxxxxxxxxxxxxxxxx" --app-type "organization"
```

_See code: [src/commands/app/create.ts](https://github.com/contentstack/contentstack-apps-cli/blob/main/src/commands/app/create.ts)_
