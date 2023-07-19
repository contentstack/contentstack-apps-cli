<!-- Insert Nodejs CI here -->
<!-- Insert Apps CLI version here -->

# @contentstack/apps-cli

## Description

This is a plugin for [Contentstack's](https://www.contentstack.com/) CLI.
It allows you to interact and work with Contentstack Apps.

## Why use this plugin

1. The `csdx app:create` command allows you to get started with a sample Contentstack application. It spawns a copy of the [Contentstack App boilerplate](https://github.com/contentstack/marketplace-app-boilerplate) on your system and registers a sample app in the organization whose uid is provided.

## How to install this plugin

```shell
$ csdx plugins:install @contentstack/apps-cli
```

## How to use this plugin

This plugin requires you to be authenticated using [csdx auth:login](https://www.contentstack.com/docs/developers/cli/authenticate-with-the-cli/).

<!-- usage -->
```sh-session
$ npm install -g @contentstack/apps-cli
$ csdx COMMAND
running command...
$ csdx (--version|-v)
@contentstack/apps-cli/0.0.0-alpha-1 darwin-arm64 node-v16.19.0
$ csdx --help [COMMAND]
USAGE
  $ csdx COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`csdx app`](#csdx-app)

## `csdx app`

Apps CLI plugin

```
USAGE
  $ csdx app

DESCRIPTION
  Apps CLI plugin

EXAMPLES
  $ csdx app:create

  $ csdx app:get

  $ csdx app:update

  $ csdx app:delete
```

_See code: [src/commands/app/index.ts](https://github.com/contentstack/apps-cli/blob/v0.0.0-alpha-1/src/commands/app/index.ts)_
<!-- commandsstop -->
