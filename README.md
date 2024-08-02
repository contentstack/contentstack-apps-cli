<!-- Insert Nodejs CI here -->
<!-- Insert Apps CLI version here -->

# @contentstack/apps-cli
Contentstack lets you develop apps in your organization using the Developer Hub portal. With the Apps CLI plugin, Contentstack CLI allows you to perform the CRUD operations on your app in Developer Hub and then use the app in your organization or stack by installing or uninstalling your app as required.

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
@contentstack/apps-cli/1.3.1 darwin-arm64 node-v18.20.2
$ csdx --help [COMMAND]
USAGE
  $ csdx COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`csdx app`](#csdx-app)
* [`csdx app:create`](#csdx-appcreate)
* [`csdx app:delete`](#csdx-appdelete)
* [`csdx app:deploy`](#csdx-appdeploy)
* [`csdx app:get`](#csdx-appget)
* [`csdx app:install`](#csdx-appinstall)
* [`csdx app:reinstall`](#csdx-appreinstall)
* [`csdx app:uninstall`](#csdx-appuninstall)
* [`csdx app:update`](#csdx-appupdate)

## `csdx app`

Apps CLI plugin

```
USAGE
  $ csdx app

DESCRIPTION
  Apps CLI plugin

EXAMPLES
  $ csdx app:create

  $ csdx app:delete

  $ csdx app:deploy

  $ csdx app:get

  $ csdx app:install

  $ csdx app:reinstall

  $ csdx app:uninstall

  $ csdx app:update
```

_See code: [src/commands/app/index.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/index.ts)_

## `csdx app:create`

Create a new app in Developer Hub and optionally clone a boilerplate locally.

```
USAGE
  $ csdx app:create [-n <value>] [--app-type stack|organization] [-c <value>] [-d <value>] [--boilerplate
    <value>] [--org <value>]

FLAGS
  -c, --config=<value>    Path of the external config
  -d, --data-dir=<value>  Current working directory.
  -n, --name=<value>      Name of the app to be created
  --app-type=<option>     [default: stack] Type of app
                          <options: stack|organization>
  --boilerplate=<value>   Provide a boilerplate. <options: App Boilerplate|DAM App Boilerplate|Ecommerce App
                          Boilerplate>
  --org=<value>           Provide the organization UID to fetch the app details for the operation.

DESCRIPTION
  Create a new app in Developer Hub and optionally clone a boilerplate locally.

EXAMPLES
  $ csdx app:create

  $ csdx app:create --name App-1 --app-type stack

  $ csdx app:create --name App-2 --app-type stack -d ./boilerplate

  $ csdx app:create --name App-3 --app-type organization --org <UID> -d ./boilerplate -c ./external-config.json

  $ csdx app:create --name App-4 --app-type organization --org <UID> --boilerplate <App Boilerplate>

  $ csdx app:create --name App-4 --app-type organization --org <UID> --boilerplate <DAM App Boilerplate>

  $ csdx app:create --name App-4 --app-type organization --org <UID> --boilerplate <Ecommerce App Boilerplate>
```

_See code: [src/commands/app/create.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/create.ts)_

## `csdx app:delete`

Delete app from marketplace

```
USAGE
  $ csdx app:delete [--app-uid <value>] [--org <value>]

FLAGS
  --app-uid=<value>  Provide the app UID of an existing app.
  --org=<value>      Provide the organization UID to fetch the app details for the operation.

DESCRIPTION
  Delete app from marketplace

EXAMPLES
  $ csdx app:delete

  $ csdx app:delete --app-uid <value>

  $ csdx app:delete --app-uid <value> --org <value> -d ./boilerplate
```

_See code: [src/commands/app/delete.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/delete.ts)_

## `csdx app:deploy`

Deploy an app

```
USAGE
  $ csdx app:deploy [--app-uid <value>] [--hosting-type Hosting with Launch|Custom Hosting] [--app-url <value>]
    [--launch-project existing|new] [-c <value>] [--org <value>]

FLAGS
  -c, --config=<value>       [optional] Please enter the path of the config file.
  --app-uid=<value>          Provide the app UID of an existing app.
  --app-url=<value>          Please enter the URL of the app you want to deploy.
  --hosting-type=<option>    Choose a valid Hosting Type.
                             <options: Hosting with Launch|Custom Hosting>
  --launch-project=<option>  Choose a new or an existing Launch project.
                             <options: existing|new>
  --org=<value>              Provide the organization UID to fetch the app details for the operation.

DESCRIPTION
  Deploy an app

EXAMPLES
  $ csdx app:deploy

  $ csdx app:deploy --org <UID> --app-uid <APP-UID-1>

  $ csdx app:deploy --org <UID> --app-uid <APP-UID-1> --hosting-type <Custom Hosting> --app-url <https://localhost:3000>

  $ csdx app:deploy --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <existing>

  $ csdx app:deploy --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <new>

  $ csdx app:deploy --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <new> --config <config-path>
```

_See code: [src/commands/app/deploy.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/deploy.ts)_

## `csdx app:get`

Get details of an app in developer hub

```
USAGE
  $ csdx app:get [--app-uid <value>] [--app-type stack|organization] [-d <value>] [--org <value>]

FLAGS
  -d, --data-dir=<value>  Current working directory.
  --app-type=<option>     [default: stack] Type of app
                          <options: stack|organization>
  --app-uid=<value>       Provide the app UID of an existing app.
  --org=<value>           Provide the organization UID to fetch the app details for the operation.

DESCRIPTION
  Get details of an app in developer hub

EXAMPLES
  $ csdx app:get

  $ csdx app:get --org <value> --app-uid <value>

  $ csdx app:get --org <value> --app-uid <value> --app-type stack

  $ csdx app:get --org <value> --app-uid <value> --app-type organization
```

_See code: [src/commands/app/get.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/get.ts)_

## `csdx app:install`

Install an app from the marketplace

```
USAGE
  $ csdx app:install [--app-uid <value>] [--stack-api-key <value>] [--org <value>]

FLAGS
  --app-uid=<value>        Provide the app UID of an existing app.
  --org=<value>            Provide the organization UID to fetch the app details for the operation.
  --stack-api-key=<value>  API key of the stack where the app operation is to be performed.

DESCRIPTION
  Install an app from the marketplace

EXAMPLES
  $ csdx app:install

  $ csdx app:install --org <UID> --app-uid <APP-UID-1>

  $ csdx app:install --org <UID> --app-uid <APP-UID-1> --stack-api-key <STACK-API-KEY-1>
```

_See code: [src/commands/app/install.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/install.ts)_

## `csdx app:reinstall`

Reinstall an app from the marketplace

```
USAGE
  $ csdx app:reinstall [--app-uid <value>] [--stack-api-key <value>] [--org <value>]

FLAGS
  --app-uid=<value>        Provide the app UID of an existing app.
  --org=<value>            Provide the organization UID to fetch the app details for the operation.
  --stack-api-key=<value>  API key of the stack where the app operation is to be performed.

DESCRIPTION
  Reinstall an app from the marketplace

EXAMPLES
  $ csdx app:reinstall

  $ csdx app:reinstall --org <UID> --app-uid <APP-UID-1>

  $ csdx app:reinstall --org <UID> --app-uid <APP-UID-1> --stack-api-key <STACK-API-KEY-1>
```

_See code: [src/commands/app/reinstall.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/reinstall.ts)_

## `csdx app:uninstall`

Uninstall an app

```
USAGE
  $ csdx app:uninstall [--app-uid <value>] [--installation-uid <value>] [--uninstall-all] [--org <value>]

FLAGS
  --app-uid=<value>           Provide the app UID of an existing app.
  --installation-uid=<value>  Provide the installation ID of the app that needs to be uninstalled.
  --org=<value>               Provide the organization UID to fetch the app details for the operation.
  --uninstall-all             Please select stacks from where the app must be uninstalled.

DESCRIPTION
  Uninstall an app

EXAMPLES
  $ csdx app:uninstall

  $ csdx app:uninstall --org <UID> --app-uid <APP-UID-1>

  $ csdx app:uninstall --org <UID> --app-uid <APP-UID-1> --installation-uid <INSTALLATION-UID-1>
```

_See code: [src/commands/app/uninstall.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/uninstall.ts)_

## `csdx app:update`

Update the existing app in developer hub

```
USAGE
  $ csdx app:update [--app-manifest <value>] [--org <value>]

FLAGS
  --app-manifest=<value>  Path to the app manifest.json file:
  --org=<value>           Provide the organization UID to fetch the app details for the operation.

DESCRIPTION
  Update the existing app in developer hub

EXAMPLES
  $ csdx app:update

  $ csdx app:update --app-manifest ./boilerplate/manifest.json
```

_See code: [src/commands/app/update.ts](https://github.com/contentstack/apps-cli/blob/v1.3.1/src/commands/app/update.ts)_
<!-- commandsstop -->
