import { CliUx } from '@oclif/core'
import * as path from 'path'

import { Command, flags } from '@contentstack/cli-command'
import { configHandler, cliux } from '@contentstack/cli-utilities'

import CMAClient from '../../core/contentstack/client'
import {
  downloadProject,
  installDependencies,
} from '../../core/apps/build-project'
import {
  changeDirectory,
  createFile,
  makeDirectory,
  unzipFileToDirectory,
} from '../../core/apps/fs-utils'
import { APP_TEMPLATE_GITHUB_URL, AUTHTOKEN } from '../../core/constants'
import { AppManifest, AppManifestWithUiLocation, AppType } from '../../typings'
import {
  deriveAppManifestFromSDKResponse,
  getErrorMessage,
  getOrgAppUiLocation,
  validateAppName,
  validateOrgUid,
} from '../../core/apps/app-utils'
import * as manifestData from '../../core/apps/manifest.json'

type CreateCommandArgs = {
  appName?: string
}

type CreateCommandFlags = {
  'app-type': string
  org?: string
  interactive?: boolean
}

export default class Create extends Command {
  private client!: CMAClient

  static description: string | undefined = 'create and register an app.'

  static examples: string[] | undefined = [
    '$ csdx app:create <app_name>',
    '$ csdx app:create <app_name> --org "xxxxxxxxxxxxxxxxxxx" --app-type [stack/organization>]',
    '$ csdx app:create <app_name> -o "xxxxxxxxxxxxxxxxxxx" -t [stack/organization>]',
  ]

  static args = [
    {
      name: 'appName',
      description: 'Name of the app to be created',
      required: false,
    },
  ]

  static flags = {
    org: flags.string({
      char: 'o',
      description: 'Organization UID',
      required: false,
    }),
    'app-type': flags.string({
      char: 't',
      description: 'Type of App',
      options: ['stack', 'organization'],
      default: 'stack',
      required: false,
    }),
    interactive: flags.boolean({
      char: 'i',
      description: 'Run command in interactive mode',
      default: false,
      required: false,
    }),
  }

  setup(orgUid: string) {
    if (!this.authToken) {
      this.error('You need to login, first. See: auth:login --help', {
        exit: 2,
        ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
      })
    }
    this.client = new CMAClient(this.authToken, orgUid)
  }

  async askAppName(): Promise<string> {
    let appName = ''
    do {
      if (appName.length > 0) cliux.error(getErrorMessage('invalid_app_name'))
      appName = await cliux.inquire({
        type: 'input',
        message: 'Enter a 3 to 20 character long name for your app',
        name: 'appName',
      })
    } while (!validateAppName(appName))
    return appName
  }

  async askOrgUid(): Promise<string> {
    let orgUid = ''
    do {
      if (orgUid.length > 0) cliux.error(getErrorMessage('invalid_org_uid'))
      orgUid = await cliux.inquire({
        type: 'input',
        message:
          'Enter the organization uid on which you wish to register the app',
        name: 'orgUid',
      })
    } while (!validateOrgUid(orgUid))
    return orgUid
  }

  async askAppType(): Promise<AppType> {
    return await await cliux.inquire({
      type: 'list',
      message: 'Enter the type of the app, you wish to create',
      name: 'appType',
      choices: [
        { name: AppType.STACK, value: AppType.STACK },
        { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
      ],
    })
  }

  async run(): Promise<any> {
    try {
      const {
        flags,
        args,
      }: { flags: CreateCommandFlags; args: CreateCommandArgs } =
        this.parse(Create)
      const _authToken = configHandler.get(AUTHTOKEN)
      if (!_authToken) {
        this.error('You need to login, first. See: auth:login --help', {
          exit: 2,
          ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
        })
      }
      let appName = args.appName
      let orgUid = flags.org
      let appType: AppType | undefined =
        (!appName || !orgUid) && flags['app-type'] !== AppType.ORGANIZATION
          ? undefined
          : (flags['app-type'] as AppType)
      const isInteractiveMode = !!flags.interactive
      //? All values to be disregarded if interactive flag present
      if (isInteractiveMode) {
        appName = await this.askAppName()
        orgUid = await this.askOrgUid()
        appType = await this.askAppType()
      } else {
        // ? Ask for app name if it does not pass the constraints
        if (!validateAppName(appName)) {
          appName = await this.askAppName()
        }
        // ? Ask for org uid if it does not pass the constraints
        if (!validateOrgUid(orgUid)) {
          orgUid = await this.askOrgUid()
        }
        // ? Explicilty ask for app type when app type is not present
        if (
          !appType ||
          (appType !== AppType.STACK && appType !== AppType.ORGANIZATION)
        ) {
          appType = await this.askAppType()
        }
      }
      this.setup(orgUid)
      CliUx.ux.action.start('Fetching the app template')
      const targetPath = path.join(process.cwd(), appName)
      const filePath = await downloadProject(APP_TEMPLATE_GITHUB_URL)
      await makeDirectory(appName)
      unzipFileToDirectory(filePath, targetPath, 'template_fetch_failure')
      const manifestObject: AppManifestWithUiLocation = JSON.parse(
        JSON.stringify(manifestData)
      )
      manifestObject.name = appName
      manifestObject.target_type = appType as AppType
      if (appType === AppType.ORGANIZATION) {
        manifestObject.ui_location.locations = getOrgAppUiLocation()
      }
      CliUx.ux.action.stop()
      CliUx.ux.action.start(
        `Registering the app with name ${appName} on Developer Hub`
      )
      const clientResponse: any = await this.client.createApp(
        manifestObject as AppManifest
      )
      const appManifest = deriveAppManifestFromSDKResponse(clientResponse)
      await createFile(
        path.join(targetPath, 'app-manifest.json'),
        JSON.stringify(appManifest),
        'manifest_generation_failure'
      )
      CliUx.ux.action.stop()
      CliUx.ux.action.start('Installing dependencies')
      await installDependencies(targetPath)
      CliUx.ux.action.stop()
      changeDirectory(targetPath)
    } catch (error: any) {
      CliUx.ux.action.stop('Failed')
      this.error(error.message)
    }
  }
}
