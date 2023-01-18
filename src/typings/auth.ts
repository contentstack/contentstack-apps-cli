export interface TokenConfiguration {
  enabled?: boolean
  scopes?: string[]
}

export interface UserTokenConfiguration extends TokenConfiguration {
  allow_pkce?: boolean
}

export interface OAuthConfiguration {
  client_id?: string
  client_secret?: string
  redirect_uri?: string
  user_token_config?: UserTokenConfiguration
  app_token_config?: TokenConfiguration
}
