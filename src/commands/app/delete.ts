import { BaseCommand } from "./base-command";
import { flags } from "@contentstack/cli-utilities";
import { $t, commonMsg, deleteAppMsg } from "../../messages";
import { getOrg, fetchAppInstallations, deleteApp, getApp } from "../../util";

export default class Delete extends BaseCommand<typeof Delete> {
    static description = "Delete app from marketplace";

    static examples = [
        "$ <%= config.bin %> <%= command.id %>",
      ];
    
    static flags = {
      'app-uid': flags.string({
          description: commonMsg.APP_UID,
      })
    };

    async run(): Promise<void> {
      try {
          this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
          const app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log});
          this.flags["app-uid"] = app?.uid;
          const {items: appInstallations}: any = await fetchAppInstallations(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log});
          if (appInstallations.length === 0) {
            await deleteApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
            this.log($t(deleteAppMsg.APP_DELETED_SUCCESSFULLY, {app: this.flags["app-uid"] as string}));
          } else {
            this.log(deleteAppMsg.APP_IS_INSTALLED, "error")
          }
      } catch(error: any) {
          this.log(error.errorMessage, "error")
          this.exit()
      }
    }
}