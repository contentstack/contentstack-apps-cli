import { Command } from '@contentstack/cli-command'

import CMAClient from './contentstack/client'

export default abstract class AppsCommand extends Command {
  public client!: CMAClient

  setup(organizationUid: string): void {
    if (!this.authToken) {
      this.error('You need to login, first. See: auth:login --help', {
        exit: 2,
        ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
      })
    }

    this.client = new CMAClient(this.authToken, organizationUid)
  }

  checkIsUserLoggedIn() {
    if (!this.authToken) {
      this.error('You need to login, first. See: auth:login --help', {
        exit: 2,
        ref: 'https://www.contentstack.com/docs/developers/cli/authentication/',
      })
    }
    return true
  }
}
