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

export function validateAppName(name: string): boolean {
  if (name && name.length > 3 && name.length < 20) return true
  return false
}

export function validateOrgUid(orgUid: string): boolean {
  if (orgUid && orgUid.length > 10) return true // Todo: Add valid org uid condition
  return false
}

export function getQuestionSet() {
  return [
    {
      type: 'input',
      name: 'appName',
      message: 'Enter a 3 to 20 character long name for your app',
      validate: function (appName: string) {
        if (!validateAppName(appName)) {
          return getErrorMessage('invalid_app_name')
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'orgUid',
      message:
        'Enter the organization uid on which you wish to register the app',
      validate: function (orgUid: string) {
        if (!validateOrgUid(orgUid)) {
          return getErrorMessage('invalid_org_uid')
        }
        return true
      },
    },
    {
      type: 'list',
      name: 'appType',
      message: 'Enter the type of the app, you wish to create',
      choices: [AppType.STACK, AppType.ORGANIZATION],
    },
  ]
}
