import { CliUx } from '@oclif/core'
import * as path from 'path'

import { flags } from '@contentstack/cli-command'

import { downloadProject } from '../../core/apps/build-project'
import { createFile, readFile, unzipFile } from '../../core/apps/fs-utils'
import Command from '../../core/command'
import { APP_TEMPLATE_GITHUB_URL } from '../../core/constants'
import { APP_TYPE } from '../../typings/app'

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
      const appType = flags['app-type'] as APP_TYPE
      this.setup()
      CliUx.ux.action.start('Fetching the app template')
      const filePath = require('os').homedir() + '/Downloads/app.zip' // Todo: Change to tmp url
      const targetPath = require('os').homedir() + '/Downloads/' // Todo: Change to current working dir

      await downloadProject(APP_TEMPLATE_GITHUB_URL, filePath)
      unzipFile(filePath, targetPath)
      const manifestData = await readFile(
        path.join(__dirname, '../../core/apps/manifest.json')
      )
      const manifestObject = JSON.parse(manifestData)
      manifestObject.name = appName
      manifestObject.target_type = appType

      this.log(manifestObject)

      await createFile(
        path.join(
          targetPath,
          'marketplace-app-boilerplate-main',
          'app-manifest.json'
        ),
        JSON.stringify(manifestObject)
      )

      CliUx.ux.action.stop()
    } catch (error: any) {
      this.error(error)
    }
  }
}
