import { CliUx } from '@oclif/core'
import * as path from 'path'

import { flags } from '@contentstack/cli-command'

import {
  downloadProject,
  installDependencies,
} from '../../core/apps/build-project'
import { createFile, readFile, unzipFile } from '../../core/apps/fs-utils'
import Command from '../../core/command'
import { APP_TEMPLATE_GITHUB_URL } from '../../core/constants'
import { AppManifest, AppManifestWithUiLocation, AppType } from '../../typings'
import {
  deriveAppManifestFromSDKResponse,
  getOrgAppUiLocation,
} from '../../core/apps/app-utils'

type CreateCommandArgs = {
  appName?: string
}

type CreateCommandFlags = {
  'app-type': string
  org?: string
  interactive?: boolean
}

export default class Create extends Command {
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

  async run(): Promise<any> {
    try {
      const {
        flags,
        args,
      }: { flags: CreateCommandFlags; args: CreateCommandArgs } =
        this.parse(Create)
      this.checkIsUserLoggedIn()
      let appName = args.appName || ''
      let orgUid = flags.org || ''
      let appType = flags['app-type'] as AppType
      const isInteractiveMode = flags.interactive
      const isOrgAppSelected = flags['app-type'] === AppType.ORGANIZATION
      // ? prompt user if args or flags are missing
      if (!args.appName || isInteractiveMode) {
        // ? ask for app name
        appName = await CliUx.ux.prompt('Enter a name for your app', {
          required: true,
        })
      }
      if (!flags.org || isInteractiveMode) {
        // ? ask for app name
        orgUid = await CliUx.ux.prompt(
          'Enter the organization uid on which you wish to register the app',
          { required: true }
        )
        // ? Ask for app type if was not mentioned as Org app above
        if (!isOrgAppSelected || isInteractiveMode)
          appType = (await CliUx.ux.prompt(
            `Enter the type of the app (stack/organization). Press enter to continue with ${
              isOrgAppSelected ? 'your selection' : 'the default'
            } selection`,
            { default: isOrgAppSelected ? AppType.ORGANIZATION : AppType.STACK }
          )) as AppType
      }
      if (flags) this.setup(orgUid)
      CliUx.ux.action.type = 'spinner'
      CliUx.ux.action.start('Fetching the app template')
      const targetPath = process.cwd()

      const filePath = await downloadProject(APP_TEMPLATE_GITHUB_URL)
      unzipFile(filePath, targetPath)
      const manifestData = await readFile(
        path.join(__dirname, '../../core/apps/manifest.json')
      )
      const manifestObject: AppManifestWithUiLocation = JSON.parse(manifestData)
      manifestObject.name = appName
      manifestObject.target_type = appType
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
        path.join(
          targetPath,
          'marketplace-app-boilerplate-main',
          'app-manifest.json'
        ),
        JSON.stringify(appManifest)
      )
      CliUx.ux.action.stop()
      CliUx.ux.action.start('Installing dependencies')
      installDependencies(
        path.join(targetPath, 'marketplace-app-boilerplate-main')
      )
      CliUx.ux.action.stop()
    } catch (error: any) {
      this.error(error.message)
    }
  }
}
