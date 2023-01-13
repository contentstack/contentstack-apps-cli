import { AppLocation, AppManifest, Extension } from '../../typings'
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
