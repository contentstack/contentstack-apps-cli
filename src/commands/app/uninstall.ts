import { flags, FlagInput } from "@contentstack/cli-utilities";

import { commonMsg, uninstallAppMsg } from "../../messages";
import {AppCLIBaseCommand} from "../../app-cli-base-command";
import { getOrg, fetchApp, getInstalledApps } from "../../util";
import { UninstallAppFactory } from "../../factories/uninstall-app-factory";

export default class Uninstall extends AppCLIBaseCommand {
    static description = "Uninstall an app";

    static examples = [
      "$ <%= config.bin %> <%= command.id %>",
      "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
      "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --installation-uid <INSTALLATION-UID-1>",
    ];

    static flags: FlagInput = {
      'app-uid': flags.string({
        description: commonMsg.APP_UID,
      }),
      'installation-uid': flags.string({
        description: uninstallAppMsg.INSTALLATION_UID
      }),
      'uninstall-all': flags.boolean({
        description: uninstallAppMsg.UNINSTALL_ALL,
      }),
      ...AppCLIBaseCommand.baseFlags,
    }

    async run(): Promise<void> {
      try {
        let app, appType
        this.flags["app-uid"] = this.manifestData?.uid ?? this.flags["app-uid"];
        
        // get organization to be used
        this.sharedConfig.org = this.manifestData?.organization_uid;
        if (!this.sharedConfig.org) {
          this.sharedConfig.org = await getOrg(this.flags, {
            managementSdk: this.managementSdk,
            log: this.log,
          });
        }

        // fetch app details
        if (!this.flags['app-uid']) {
          app = await getInstalledApps(this.flags, this.sharedConfig.org, {marketplaceSdk: this.marketplaceAppSdk, log: this.log})
        } else {
          app = await fetchApp(this.flags, this.sharedConfig.org, {marketplaceSdk: this.marketplaceAppSdk, log: this.log})
        }

        this.flags['app-uid'] = app?.uid;
        appType = app?.['target_type']

        const factory = new UninstallAppFactory()
        const strategy = factory.getStrategyInstance(this.flags['uninstall-all'])
        await strategy.run(this.flags, this.sharedConfig.org, this.managementSdk, {managementSdk: this.managementAppSdk, log: this.log}, appType)

        this.log(this.$t(uninstallAppMsg.APP_UNINSTALLED, { app: app?.name || this.flags["app-uid"] }), "info")

      } catch (error: any) {
        this.log(error?.errorMessage || error?.message || error, "error")
        this.exit(1);
      }
    }

}