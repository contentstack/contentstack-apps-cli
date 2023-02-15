import * as contentstack from '@contentstack/management'

import { AppManifest } from '../../typings'
import { getErrorMessage } from '../apps/app-utils'
import { DEVELOPERHUB_API_HOST_URL } from '../../constants'
import ContentstackError from './error'

export default class DeveloperHubClient {
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
    try {
      const app = await this.client
        .organization(this.organizationUid)
        .app()
        .create(appData as any)
      return app
    } catch (error: any) {
      let errorKey = 'app_creation_failure'
      switch (error.status) {
        case 400:
          errorKey = 'app_creation_constraint_failure'
          break
        case 403:
          errorKey = 'app_creation_invalid_org'
          break
        case 409:
          errorKey = 'duplicate_app_name'
          break
      }
      throw new ContentstackError(getErrorMessage(errorKey))
    }
  }
}
