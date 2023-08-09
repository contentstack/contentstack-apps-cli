import { ContentstackClient, FlagInput } from "@contentstack/cli-utilities";
import { UninstallApp } from "../interfaces/uninstall-app";
import { CommonOptions, getInstallation, uninstallApp } from "../util";
import { AppTarget } from "@contentstack/management/types/app/index"

export class UninstallSelected implements UninstallApp {
  public async run(flags: FlagInput, org: string, managementSdk: ContentstackClient, options: CommonOptions, appType: AppTarget): Promise<void> {
    // select installation uid to uninstall
    const installationUids = await this.getInstallations(flags, org, managementSdk, options, appType)
    for (const installationUid of installationUids) {
      await uninstallApp(flags, org, options, installationUid)
    }
  }

  public async getInstallations(flags: FlagInput, org: string, managementSdk: ContentstackClient, options: CommonOptions, appType: AppTarget): Promise<string[]> {
    let installationUids: any = flags['installation-uid'];
    if (!installationUids) {
      installationUids = await getInstallation(flags, org, managementSdk, appType, options)
    }
    return installationUids.split(',')
  }
}