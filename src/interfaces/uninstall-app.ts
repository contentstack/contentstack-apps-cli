import {
  ContentstackClient,
  ContentstackMarketplaceClient,
  FlagInput,
} from "@contentstack/cli-utilities";
import { CommonOptions } from "../util";
import { AppTarget } from "@contentstack/marketplace-sdk/types/marketplace/app";

export interface UninstallApp {
  run(
    flags: FlagInput,
    org: string,
    managementSdk: ContentstackClient,
    options: CommonOptions,
    appType: AppTarget,
    marketplaceSdk: ContentstackMarketplaceClient
  ): Promise<void>;
}
