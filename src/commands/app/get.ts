import { BaseCommand } from "./base-command";
import { getOrg, getApp, writeFile, fetchApp } from "../../util";
import { flags } from "@contentstack/cli-utilities";
import { commonMsg } from "../../messages";

export default class Get extends BaseCommand<typeof Get> {
  static hidden: boolean = false;

  static description = "Get details of an app in developer hub";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value>",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value> --app-type stack",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value> --app-type organization",
  ];

  static flags = {
    "app-uid": flags.string({
      description: commonMsg.APP_UID,
    }),
    "app-type": flags.string({
      default: "stack",
      options: ["stack", "organization"],
      description: commonMsg.APP_TYPE_DESCRIPTION,
    }),
    "data-dir": flags.string({
      char: "d",
      description: commonMsg.CURRENT_WORKING_DIR,
    }),
  };

  async run(): Promise<void> {
    try {
      let appData;
      this.sharedConfig.org = await getOrg(this.flags, {
        managementSdk: this.managementSdk,
        log: this.log,
      });
      if (!this.flags["app-uid"]) {
        appData = await getApp(this.flags, this.sharedConfig.org, {
          managementSdk: this.managementAppSdk,
          log: this.log,
        });
      } else {
        appData = await fetchApp(this.flags, this.sharedConfig.org, {
          managementSdk: this.managementAppSdk,
          log: this.log,
        });
      }
      await writeFile(
        this.flags["data-dir"],
        this.flags["yes"],
        appData,
        this.log
      );
    } catch (error: any) {
      this.log(error?.errorMessage || error?.message || error, "error");
      this.exit(1);
    }
  }
}
