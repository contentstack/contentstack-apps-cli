import { ContentstackClient, FlagInput } from "@contentstack/cli-utilities";
import { UninstallApp } from "../interfaces/uninstall-app";
import { CommonOptions, getInstallation, uninstallApp } from "../util";
import { AppTarget } from "@contentstack/management/types/app/index"

export class UninstallAll implements UninstallApp {
  public async run(flags: FlagInput, org: string, managementSdk: ContentstackClient, options: CommonOptions, appType: AppTarget): Promise<void> {
    // get all installation uids to uninstall
    const installationUids = await this.getInstallations(flags, org, managementSdk, options, appType)
    for (const installationUid of installationUids) {
      await uninstallApp(flags, org, options, installationUid)
    }
  }

  public async getInstallations(flags: FlagInput, org: string, managementSdk: ContentstackClient, options: CommonOptions, appType: AppTarget): Promise<string[]> {
    let installationUids: string = await getInstallation(flags, org, managementSdk, appType, options, true)
    return installationUids.split(',')
  }
}