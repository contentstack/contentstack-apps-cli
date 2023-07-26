import { BaseCommand } from "./base-command";
import { flags } from "@contentstack/cli-utilities";
import { getOrg, getApp, fetchApp, getInstallation, uninstallApp } from "../../util";
import { commonMsg, uninstallAppMsg } from "../../messages";

export default class Uninstall extends BaseCommand<typeof Uninstall> {
    static description = "Uninstall an app";
    static hidden: boolean = false;

    static examples = [
      "$ <%= config.bin %> <%= command.id %>",
      "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
      "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --installation-uid <INSTALLATION-UID-1>",
    ];

    static flags = {
      'app-uid': flags.string({
        description: commonMsg.APP_UID,
      }),
      'installation-uid': flags.string({
        description: uninstallAppMsg.INSTALLATION_UID
      })
    }

    async run(): Promise<void> {
      try {
        let app, appType
        // get organization to be used
        this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});

        // fetch app details
        if (!this.flags['app-uid']) {
          app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        } else {
          app = await fetchApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        }
        
        this.flags['app-uid'] = app?.uid;
        appType = app?.['target_type']

        // select installation uid to uninstall
        if (!this.flags['installation-uid']) {
          this.flags['installation-uid'] = await getInstallation(this.flags, this.sharedConfig.org, this.managementSdk, appType, {managementSdk: this.managementAppSdk, log: this.log})
        }
        
        // uninstall app
        await uninstallApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        this.log(this.$t(uninstallAppMsg.APP_UNINSTALLED, { app: app?.name || this.flags["app-uid"] }), "info")

      } catch (error: any) {
        this.log(error?.errorMessage || error?.message || error, "error")
        this.exit(1);
      }
    }

}