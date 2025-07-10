import {
  ContentstackClient,
  ContentstackMarketplaceClient,
  FlagInput,
} from "@contentstack/cli-utilities";
import { UninstallApp } from "../interfaces/uninstall-app";
import {
  CommonOptions,
  MarketPlaceOptions,
  getInstallation,
  uninstallApp,
} from "../util";
import { AppTarget } from "@contentstack/management/types/app/index";

export class UninstallAll implements UninstallApp {
  public async run(
    flags: FlagInput,
    org: string,
    managementSdk: ContentstackClient,
    options: CommonOptions,
    appType: AppTarget,
    marketplaceSdk: ContentstackMarketplaceClient
  ): Promise<void> {
    // get all installation uids to uninstall
    const installationUids = await this.getInstallations(
      flags,
      org,
      managementSdk,
      options,
      appType,
      marketplaceSdk
    );
    for (const installationUid of installationUids) {
      const marketplaceOptions: MarketPlaceOptions = {
        log: options.log,
        marketplaceSdk: marketplaceSdk,
      };
      await uninstallApp(org, marketplaceOptions, installationUid);
    }
  }

  public async getInstallations(
    flags: FlagInput,
    org: string,
    managementSdk: ContentstackClient,
    options: CommonOptions,
    appType: AppTarget,
    marketplaceSdk: ContentstackMarketplaceClient
  ): Promise<string[]> {
    let installationUids: string = await getInstallation(
      flags,
      org,
      managementSdk,
      appType,
      options,
      marketplaceSdk,
      true
    );
    return installationUids.split(",");
  }
}
