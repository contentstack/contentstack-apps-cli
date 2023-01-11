import { Command } from '@contentstack/cli-command'

export default class AppsCommand extends Command {
  run(): PromiseLike<any> {
    throw new Error('Method not implemented.')
  }

  setup(): void {
    if (!this.authToken) {
      this.error('You need to login, first. See: auth:login --help', {
        exit: 2,
        ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
      })
    }
  }
}
