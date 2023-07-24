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
* [`csdx app:create`](#csdx-appcreate)
* [`csdx app:delete`](#csdx-appdelete)
* [`csdx app:get`](#csdx-appget)
* [`csdx app:update`](#csdx-appupdate)

## `csdx app:create`

Create new app in developer hub

```
USAGE
  $ csdx app:create [--org <value>] [-y] [-n <value>] [--app-type stack|organization] [-c <value>] [-d <value>]

FLAGS
  -c, --config=<value>    Path of the external config
  -d, --data-dir=<value>  Current working directory.
  -n, --name=<value>      Name of the app to be created
  -y, --yes               Use this flag to skip the confirmation.
  --app-type=<option>     [default: stack] Type of App
                          <options: stack|organization>
  --org=<value>           Provide the organization UID

DESCRIPTION
  Create new app in developer hub

EXAMPLES
  $ csdx app:create

  $ csdx app:create --name App-1 --app-type stack --yes

  $ csdx app:create --name App-2 --app-type stack -d ./boilerplate --yes

  $ csdx app:create --name App-3 --app-type organization --org <UID> -d ./boilerplate -c ./external-config.json --yes
```

_See code: [src/commands/app/create.ts](https://github.com/contentstack/apps-cli/blob/v0.0.0-alpha-1/src/commands/app/create.ts)_

## `csdx app:delete`

Delete app from marketplace

```
USAGE
  $ csdx app:delete [--org <value>] [-y] [--app-uid <value>]

FLAGS
  -y, --yes          Use this flag to skip the confirmation.
  --app-uid=<value>  Provide the app UID
  --org=<value>      Provide the organization UID

DESCRIPTION
  Delete app from marketplace

EXAMPLES
  $ csdx app:delete

  $ csdx app:delete --app-uid <value>

  $ csdx app:delete --app-uid <value> --org <value> -d ./boilerplate
```

_See code: [src/commands/app/delete.ts](https://github.com/contentstack/apps-cli/blob/v0.0.0-alpha-1/src/commands/app/delete.ts)_

## `csdx app:get`

Get details of an app in developer hub

```
USAGE
  $ csdx app:get [--org <value>] [-y] [--app-uid <value>] [--app-type stack|organization] [-d <value>]

FLAGS
  -d, --data-dir=<value>  Current working directory.
  -y, --yes               Use this flag to skip the confirmation.
  --app-type=<option>     [default: stack] Type of App
                          <options: stack|organization>
  --app-uid=<value>       Provide the app UID
  --org=<value>           Provide the organization UID

DESCRIPTION
  Get details of an app in developer hub

EXAMPLES
  $ csdx app:get

  $ csdx app:get --org <value> --app-uid <value>

  $ csdx app:get --org <value> --app-uid <value> --app-type stack

  $ csdx app:get --org <value> --app-uid <value> --app-type organization
```

_See code: [src/commands/app/get.ts](https://github.com/contentstack/apps-cli/blob/v0.0.0-alpha-1/src/commands/app/get.ts)_

## `csdx app:update`

Update the existing app in developer hub

```
USAGE
  $ csdx app:update [--org <value>] [-y] [--app-uid <value>] [--app-manifest <value>] [-c <value>] [-d <value>]

FLAGS
  -c, --config=<value>    Path of the external config
  -d, --data-dir=<value>  Current working directory.
  -y, --yes               Use this flag to skip the confirmation.
  --app-manifest=<value>  Path to the app manifest.json file:
  --app-uid=<value>       Provide the app UID
  --org=<value>           Provide the organization UID

DESCRIPTION
  Update the existing app in developer hub

EXAMPLES
  $ csdx app:update

  $ csdx app:update --org <value> --app-uid <value> --app-manifest <value>

  $ csdx app:update --org <value> --app-uid <value> --app-manifest ./boilerplate/manifest.json

  $ csdx app:update --org <value> --app-uid <value> -d ./boilerplate -c ./external-config.json --yes
```

_See code: [src/commands/app/update.ts](https://github.com/contentstack/apps-cli/blob/v0.0.0-alpha-1/src/commands/app/update.ts)_
<!-- commandsstop -->
