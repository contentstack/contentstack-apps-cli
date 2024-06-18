import { FlagInput } from "@contentstack/cli-utilities";
import { ConfigType } from "./utils";

export interface TokenConfiguration {
  enabled?: boolean;
  scopes?: string[];
}

export interface UserTokenConfiguration extends TokenConfiguration {
  allow_pkce?: boolean;
}

export interface OAuthConfiguration {
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  user_token_config?: UserTokenConfiguration;
  app_token_config?: TokenConfiguration;
}

export enum AppLocation {
  STACK_CONFIG = "cs.cm.stack.config",
  DASHBOARD = "cs.cm.stack.dashboard",
  SIDEBAR = "cs.cm.stack.sidebar",
  CUSTOM_FIELD = "cs.cm.stack.custom_field",
  RTE = "cs.cm.stack.rte",
  ASSET_SIDEBAR = "cs.cm.stack.asset_sidebar",
  ORG_CONFIG = "cs.org.config",
}

export enum ExtensionWidth {
  FULL = "full",
  HALF = "half",
}

export interface ExtensionMeta {
  uid?: string;
  name?: string;
  description?: string;
  path?: string;
  signed: boolean;
  extension_uid?: string;
  data_type?: string;
  enabled?: boolean;
  width?: number;
  blur?: boolean;
  default_width?: ExtensionWidth;
}

export interface Extension {
  type: AppLocation;
  meta: ExtensionMeta[];
}

export interface LocationConfiguration {
  signed: boolean;
  base_url: string;
  locations: Extension[];
}

export interface CustomHeader {
  value: string;
  header_name: string;
}

export interface WebhookConfiguration {
  name?: string;
  signed: boolean;
  enabled: boolean;
  target_url: string;
  channels: string[];
  http_basic_auth?: string;
  http_basic_password?: string;
  custom_headers?: CustomHeader[];
  concise_payload?: boolean;
  retry_policy?: string;
}

export interface User {
  uid: string;
  first_name?: string;
  last_name?: string;
}

export enum AppType {
  STACK = "stack",
  ORGANIZATION = "organization",
}

export enum VisibilityType {
  PRIVATE = "private",
  PUBLIC = "public",
  PUBLIC_UNLISTED = "public_unlisted",
}

export interface AppManifest {
  uid: string;
  framework_version?: string;
  version?: number;
  name: string;
  icon?: string;
  target_type: AppType;
  description: string;
  visibility: VisibilityType;
  webhook?: WebhookConfiguration;
  ui_location: LocationConfiguration;
  created_by?: User;
  created_at?: Date;
  updated_by?: User;
  updated_at?: Date;
  organization_uid: string;
  oauth?: OAuthConfiguration;
  hosting?: any;
}

export interface AppManifestWithUiLocation extends AppManifest {
  ui_location: LocationConfiguration;
}

export interface ReinstallParams {
  flags: FlagInput;
  type: string;
  orgUid: string;
  manifestUid: string;
  configType: ConfigType;
  developerHubBaseUrl: string;
}

export interface UpdateHostingParams {
  provider: string;
  deployment_url: string;
  environment_uid: string;
  project_uid: string;
}

export interface LaunchProjectRes {
  name: any;
  uid: any;
  url: any;
  environmentUid: any;
  developerHubAppUid: any;
}
