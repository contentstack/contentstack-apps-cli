import { CliUx } from '@oclif/core'
import * as path from 'path'

import { Command, flags } from '@contentstack/cli-command'
import { configHandler, cliux } from '@contentstack/cli-utilities'
import { ContentstackClient } from '@contentstack/management'

import DeveloperHubClient from '../../core/contentstack/client'
import {
  downloadProject,
  installDependencies,
} from '../../core/apps/project-utils'
import {
  changeDirectory,
  createFile,
  makeDirectory,
  unzipFileToDirectory,
} from '../../core/apps/fs-utils'
import { APP_TEMPLATE_GITHUB_URL, AUTHTOKEN } from '../../constants'
import { AppManifest, AppManifestWithUiLocation, AppType } from '../../typings'
import {
  deriveAppManifestFromSDKResponse,
  getErrorMessage,
  getOrgAppUiLocation,
  validateAppName,
  validateOrgUid,
} from '../../core/apps/app-utils'
import * as manifestData from '../../core/apps/manifest.json'
import {
  askAppName,
  askAppType,
  getOrganizationChoice,
} from '../../core/apps/command-utils'

type CreateCommandFlags = {
  'app-type': string
  org?: string
  name?: string
  interactive?: boolean
}

export default class Create extends Command {
  private client: DeveloperHubClient

  static description: string | undefined = 'create and register an app.'

  static examples: string[] | undefined = [
    '$ csdx app:create',
    '$ csdx app:create -n "sample app"',
    '$ csdx app:create --name="app_name" --org "xxxxxxxxxxxxxxxxxxx" --app-type [stack/organization>]',
  ]

  static flags = {
    name: flags.string({
      char: 'n',
      description: 'Name of the app to be created',
      required: false,
    }),
    org: flags.string({
      description: 'Organization UID',
      required: false,
    }),
    'app-type': flags.string({
      description: 'Type of App',
      options: ['stack', 'organization'],
      default: 'stack',
      required: false,
    }),
    interactive: flags.boolean({
      description: 'Run command in interactive mode',
      default: false,
      required: false,
    }),
  }

  setup(authtoken: string, orgUid: string) {
    if (!this.authToken) {
      this.error(getErrorMessage('authentication_error'), {
        exit: 2,
        ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
      })
    }

    this.client = new DeveloperHubClient(authtoken, orgUid)
  }

  async run(): Promise<any> {
    try {
      const { flags }: { flags: CreateCommandFlags } = this.parse(Create)
      const _authToken: string = configHandler.get(AUTHTOKEN)
      if (!_authToken) {
        this.error(getErrorMessage('authentication_error'), {
          exit: 2,
          ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
        })
      }
      this.managementAPIClient = {
        authtoken: _authToken,
      }
      let appName = flags.name
      let orgUid = flags.org
      let appType: AppType | undefined =
        (!appName || !orgUid) && flags['app-type'] !== AppType.ORGANIZATION
          ? undefined
          : (flags['app-type'] as AppType)
      const isInteractiveMode = !!flags.interactive

      //? All values to be disregarded if interactive flag present
      if (isInteractiveMode) {
        appName = await askAppName()
        orgUid = await getOrganizationChoice(
          this.managementAPIClient as ContentstackClient
        )
        appType = await askAppType()
      } else {
        // ? Ask for app name if it does not pass the constraints
        if (!validateAppName(appName)) {
          appName = await askAppName()
        }
        // ? Ask for org uid if it does not pass the constraints
        if (!validateOrgUid(orgUid)) {
          orgUid = await getOrganizationChoice(
            this.managementAPIClient as ContentstackClient
          )
        }
        // ? Explicilty ask for app type when app type is not present
        if (
          !appType ||
          (appType !== AppType.STACK && appType !== AppType.ORGANIZATION)
        ) {
          appType = await askAppType()
        }
      }
      this.setup(_authToken, orgUid)
      CliUx.ux.action.start('Fetching the app template')
      const targetPath = path.join(process.cwd(), appName)
      const filePath = await downloadProject(APP_TEMPLATE_GITHUB_URL)
      await makeDirectory(appName)
      unzipFileToDirectory(filePath, targetPath, 'template_fetch_failure')
      const manifestObject: AppManifestWithUiLocation = JSON.parse(
        JSON.stringify(manifestData)
      )
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
        path.join(targetPath, 'app-manifest.json'),
        JSON.stringify(appManifest),
        'manifest_generation_failure'
      )
      CliUx.ux.action.stop()
      CliUx.ux.action.start('Installing dependencies')
      await installDependencies(targetPath)
      CliUx.ux.action.stop()
      changeDirectory(targetPath)
      cliux.success('App creation successful!!')
    } catch (error: any) {
      CliUx.ux.action.stop('Failed')
      this.error(error.message)
    }
  }
}
