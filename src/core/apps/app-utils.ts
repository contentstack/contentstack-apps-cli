import { cliux } from '@contentstack/cli-utilities'

import { AppLocation, AppManifest, AppType, Extension } from '../../typings'
import * as errors from './errors.json'

export function deriveAppManifestFromSDKResponse(
  response: any
): Partial<AppManifest> {
  const {
    uid,
    framework_version,
    version,
    name,
    icon,
    target_type,
    description,
    visibility,
    ui_location,
    created_by,
    created_at,
    updated_by,
    updated_at,
    organization_uid,
    oauth,
  } = response
  return {
    uid,
    framework_version,
    version,
    name,
    icon,
    target_type,
    description,
    visibility,
    ui_location,
    created_by,
    created_at,
    updated_by,
    updated_at,
    organization_uid,
    oauth,
  }
}

export function getOrgAppUiLocation(): Extension[] {
  const orgConfigLocation = {
    type: AppLocation.ORG_CONFIG,
    meta: [
      {
        path: '/app-configuration',
        signed: true,
        enabled: true,
      },
    ],
  }
  return [orgConfigLocation]
}

export function getErrorMessage(errorCode: string): string {
  return (errors as any)[errorCode]
}

export function validateAppName(name = ''): boolean {
  name = name.trim()
  if (name && name.length >= 3 && name.length < 20) return true
  return false
}

export function validateOrgUid(orgUid = ''): boolean {
  orgUid = orgUid.trim()
  if (orgUid && orgUid.length > 10) return true // Todo: Add valid org uid condition
  return false
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
  return await await cliux.inquire({
    type: 'list',
    message: 'Enter the type of the app, you wish to create',
    name: 'appType',
    choices: [
      { name: AppType.STACK, value: AppType.STACK },
      { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
    ],
  })
}
