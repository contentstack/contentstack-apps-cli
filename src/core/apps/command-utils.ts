const ora = require('ora')

import { ContentstackClient } from '@contentstack/management'
import { cliux } from '@contentstack/cli-utilities'

import { getErrorMessage, validateAppName, validateOrgUid } from './app-utils'
import { AppType } from '../../typings'

export async function getOrganizationList(
  client: ContentstackClient
): Promise<any[]> {
  const organizations = await client.organization().fetchAll({ limit: 100 })
  return organizations.items
}

export async function getOrganizationChoice(
  client: ContentstackClient
): Promise<string> {
  const orgUidList = {}
  const orgChoice = {
    type: 'list',
    name: 'orgUid',
    message: 'Choose an organization where you want to create your app',
    choices: [],
  }
  const spinner = ora('Fetching Organizations').start()

  try {
    const organizations = await getOrganizationList(client)
    for (const element of organizations) {
      orgUidList[element.name] = element.uid
      orgChoice.choices.push(element.name)
    }
    spinner.succeed('Fetched Organizations')
  } catch (error) {
    spinner.fail('Fetching Organizations failed')
    cliux.error(getErrorMessage('request_failure_org_list'))
    return await askOrgUid()
  }
  const orgName: string = await cliux.inquire(orgChoice)
  return orgUidList[orgName]
}

export async function askAppName(): Promise<string> {
  let appName = ''
  do {
    if (appName.length > 0) cliux.error(getErrorMessage('invalid_app_name'))
    appName = await cliux.inquire({
      type: 'input',
      message: 'Enter a 3 to 20 character long name for your app',
      name: 'appName',
    })
  } while (!validateAppName(appName))
  return appName
}

export async function askOrgUid(): Promise<string> {
  let orgUid = ''
  do {
    if (orgUid.length > 0) cliux.error(getErrorMessage('invalid_org_uid'))
    orgUid = await cliux.inquire({
      type: 'input',
      message:
        'Enter the organization uid on which you wish to register the app',
      name: 'orgUid',
    })
  } while (!validateOrgUid(orgUid))
  return orgUid
}

export async function askAppType(): Promise<AppType> {
  return await cliux.inquire({
    type: 'list',
    message: 'Enter the type of the app, you wish to create',
    name: 'appType',
    choices: [
      { name: AppType.STACK, value: AppType.STACK },
      { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
    ],
  })
}
