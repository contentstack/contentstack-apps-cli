export enum AppLocation {
  STACK_CONFIG = 'cs.cm.stack.config',
  DASHBOARD = 'cs.cm.stack.dashboard',
  SIDEBAR = 'cs.cm.stack.sidebar',
  CUSTOM_FIELD = 'cs.cm.stack.custom_field',
  RTE = 'cs.cm.stack.rte',
  ASSET_SIDEBAR = 'cs.cm.stack.asset_sidebar',
  ORG_CONFIG = 'cs.org.config',
}

export enum ExtensionWidth {
  FULL = 'full',
  HALF = 'half',
}

export interface ExtensionMeta {
  uid?: string
  name?: string
  description?: string
  path?: string
  signed: boolean
  extension_uid?: string
  data_type?: string
  enabled?: boolean
  width?: number
  blur?: boolean
  default_width?: ExtensionWidth
}

export interface Extension {
  type: AppLocation
  meta: ExtensionMeta[]
}

export interface LocationConfiguration {
  signed: boolean
  base_url: string
  locations: Extension[]
}
