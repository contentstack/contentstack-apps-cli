import { cliux, flags, FlagInput } from "@contentstack/cli-utilities";

import { AppCLIBaseCommand } from "../../app-cli-base-command";
import { $t, commonMsg, deleteAppMsg } from "../../messages";
import { getOrg, fetchAppInstallations, deleteApp, getApp } from "../../util";

export default class Delete extends AppCLIBaseCommand {
  static description = "Delete app from marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --app-uid <value>",
    "$ <%= config.bin %> <%= command.id %> --app-uid <value> --org <value> -d ./boilerplate",
  ];

  static flags: FlagInput = {
    "app-uid": flags.string({
      description: commonMsg.APP_UID,
    }),
    ...AppCLIBaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    try {
      let app;
      this.sharedConfig.org = this.manifestData?.organization_uid;
      if (!this.sharedConfig.org) {
        this.sharedConfig.org = await getOrg(this.flags, {
          managementSdk: this.managementSdk,
          log: this.log,
        });
      }
      this.flags["app-uid"] = this.manifestData?.uid ?? this.flags["app-uid"];

      if (!this.flags["app-uid"]) {
        app = await getApp(this.flags, this.sharedConfig.org, {
          marketplaceSdk: this.marketplaceAppSdk,
          log: this.log,
        });
        this.flags["app-uid"] = app?.uid;
      }
      const { items: appInstallations }: any = await fetchAppInstallations(
        this.flags,
        this.sharedConfig.org,
        { marketplaceSdk: this.marketplaceAppSdk, log: this.log }
      );
      if (appInstallations.length === 0) {
        const userConfirmation =
          this.flags["yes"] ||
          (await cliux.inquire({
            type: "confirm",
            message: deleteAppMsg.DELETE_CONFIRMATION,
            name: "confirmation",
          }));

        if (userConfirmation) {
          await deleteApp(this.flags, this.sharedConfig.org, {
            marketplaceSdk: this.marketplaceAppSdk,
            log: this.log,
          });
          this.log(
            $t(deleteAppMsg.APP_DELETED_SUCCESSFULLY, {
              app: app?.name || (this.flags["app-uid"] as string),
            }),
            "info"
          );
        } else {
          this.log(commonMsg.USER_TERMINATION, "error");
        }
      } else {
        this.log(deleteAppMsg.APP_IS_INSTALLED, "error");
      }
    } catch (error: any) {
      this.log(error?.errorMessage || error?.message || error, "error");
      if (error.status === 400) {
        // check for invalid app-uid
        this.log(deleteAppMsg.PLEASE_SELECT_APP_FROM_LIST);
        delete this.flags["app-uid"];
        await this.run();
      }
      if (error.status === 409 && error.statusText === "Conflict") {
        this.log(commonMsg.CONTACT_SUPPORT, "error");
      }
    }
  }
}
