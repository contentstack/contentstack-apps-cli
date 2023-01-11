export interface CustomHeader {
  value: string
  header_name: string
}

export interface WebhookConfiguration {
  name?: string
  signed: boolean
  enabled: boolean
  target_url: string
  channels: string[]
  http_basic_auth?: string
  http_basic_password?: string
  custom_headers?: CustomHeader[]
  concise_payload?: boolean
  retry_policy?: string
}
