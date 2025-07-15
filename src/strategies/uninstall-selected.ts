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
import { AppTarget } from "@contentstack/marketplace-sdk/types/marketplace/app";

export class UninstallSelected implements UninstallApp {
  public async run(
    flags: FlagInput,
    org: string,
    managementSdk: ContentstackClient,
    options: CommonOptions,
    appType: AppTarget,
    marketplaceSdk: ContentstackMarketplaceClient
  ): Promise<void> {
    // select installation uid to uninstall
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
    let installationUids: any = flags["installation-uid"];
    if (!installationUids) {
      installationUids = await getInstallation(
        flags,
        org,
        managementSdk,
        appType,
        options,
        marketplaceSdk
      );
    }
    return installationUids.split(",");
  }
}
