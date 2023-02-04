import { CliUx } from '@oclif/core'
import * as path from 'path'
const inquirer = require('inquirer')

import { Command, flags } from '@contentstack/cli-command'
import { configHandler } from '@contentstack/cli-utilities'

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
  getOrgAppUiLocation,
  getQuestionSet,
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
      let appType: AppType | undefined = flags['app-type'] as AppType
      const isInteractiveMode = !!flags.interactive
      //? All values to be disregarded if interactive flag present
      if (isInteractiveMode) {
        appName = undefined
        orgUid = undefined
        appType = undefined
      } else {
        // ? Ask for app name if it does not pass the constraints
        if (!validateAppName(appName || '')) {
          appName = undefined
        }
        // ? Ask for org uid if it does not pass the constraints
        if (!validateOrgUid(orgUid || '')) {
          orgUid = undefined
        }
        // ? Explicilty ask for app type when app name or org uid is missing and app type is not specified as organization
        if ((!appName || !orgUid) && appType !== AppType.ORGANIZATION) {
          appType = undefined
        }
      }

      // ? prompt user if args or flags are missing
      const answers = await inquirer.prompt(getQuestionSet(), {
        appName,
        orgUid,
        appType,
      })
      appName = answers.appName
      orgUid = answers.orgUid
      appType = answers.appType

      this.setup(orgUid as string)

      CliUx.ux.action.start('Fetching the app template')
      const targetPath = path.join(process.cwd(), appName as string)
      const filePath = await downloadProject(APP_TEMPLATE_GITHUB_URL)
      await makeDirectory(appName as string)
      unzipFileToDirectory(filePath, targetPath, 'template_fetch_failure')
      const manifestObject: AppManifestWithUiLocation = JSON.parse(
        JSON.stringify(manifestData)
      )
      manifestObject.name = appName as string
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
