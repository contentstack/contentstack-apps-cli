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

interface CreateCommandArgs {
  appName: string
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
      required: true,
    },
  ]

  static flags = {
    org: flags.string({
      char: 'o',
      description: 'Organization UID',
      required: true,
    }),
    'app-type': flags.string({
      char: 't',
      description: 'Type of App',
      options: ['stack', 'organization'],
      default: 'stack',
      required: false,
    }),
  }

  async run(): Promise<any> {
    try {
      const { flags, args } = this.parse(Create)
      const { appName } = args as CreateCommandArgs
      const orgUid = flags.org
      const appType = flags['app-type'] as AppType
      this.setup(orgUid)
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
      CliUx.ux.action.start('Registering the app')
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
      this.error(error)
    }
  }
}
