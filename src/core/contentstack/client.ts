import * as contentstack from '@contentstack/management'

import { AppManifest } from '../../typings'
import { DEVELOPERHUB_API_HOST_URL } from '../constants'

export default class CMAClient {
  private client: contentstack.ContentstackClient
  private organizationUid: string

  constructor(authtoken: string, orgnaizationUid: string) {
    this.client = contentstack.client({
      authtoken,
      host: DEVELOPERHUB_API_HOST_URL,
    })
    this.organizationUid = orgnaizationUid
  }

  async createApp(appData: AppManifest) {
    const app = await this.client
      .organization(this.organizationUid)
      .app()
      .create(appData as any)
    return app
  }
}
