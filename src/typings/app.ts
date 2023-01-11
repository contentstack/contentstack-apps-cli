import {
  OAuthConfiguration,
  LocationConfiguration,
  User,
  WebhookConfiguration,
} from './'

export enum AppType {
  STACK = 'stack',
  ORGANIZATION = 'organization',
}

export enum VisibilityType {
  PRIVATE = 'private',
  PUBLIC = 'public',
  PUBLIC_UNLISTED = 'public_unlisted',
}

export interface AppManifest {
  uid: string
  framework_version?: string
  version?: number
  name: string
  icon?: string
  target_type: AppType
  description: string
  visibility: VisibilityType
  webhook?: WebhookConfiguration
  ui_location?: LocationConfiguration
  created_by?: User
  created_at?: Date
  updated_by?: User
  updated_at?: Date
  organization_uid: string
  oauth?: OAuthConfiguration
  hosting?: any
}

export interface AppManifestWithUiLocation extends AppManifest {
  ui_location: LocationConfiguration
}
