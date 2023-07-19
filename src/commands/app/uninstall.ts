import { BaseCommand } from "./base-command";
import { Stack, flags } from "@contentstack/cli-utilities";
import { getOrg, getApp, fetchApp, getInstallation, uninstallApp } from "../../util";
import { $t, commonMsg, uninstallAppMsg } from "../../messages";

export default class Uninstall extends BaseCommand<typeof Uninstall> {
    static description = "Uninstall an app";

    static flags = {
      'app-uid': flags.string({
        description: commonMsg.APP_UID,
      }),
      'installation-uid': flags.string({
        description: uninstallAppMsg.CHOOSE_AN_INSTALLATION
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
          const installation: unknown = await getInstallation(this.flags, this.sharedConfig.org, this.managementSdk, appType, {managementSdk: this.managementAppSdk, log: this.log})
          this.flags['installation-uid'] = installation as string;
        }
        
        // uninstall app
        await uninstallApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        this.log(this.$t(uninstallAppMsg.APP_UNINSTALLED, { app: app?.name || this.flags["app-uid"] }), "info")

        // const installations = await fetchAppInstallations(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        // console.log(installations)
        // const installationData = await installations.items[0].fetch()
        // console.log(installationData)
      } catch (error: any) {
        this.log(error?.errorMessage || error?.message || error, "error")
      }
    }

}