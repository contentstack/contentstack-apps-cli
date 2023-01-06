import { flags } from '@contentstack/cli-command'
import Command from '../../core/command'

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
      this.log('Flags and Args are', flags, args)
      this.setup()
      const result: string = await new Promise((res) => {
        setTimeout(() => res('Operation Performed successfully'), 3000)
      })
      this.log(result)
    } catch (error: any) {
      this.error(error, {
        exit: error.oclif.exit,
        ref: error.suggestions,
      })
    }
  }
}
