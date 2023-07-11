import { BaseCommand } from "./base-command";
import { getOrg, getApp, writeFile } from "../../util";
import { flags } from "@contentstack/cli-utilities";
import { commonMsg } from "../../messages";

export default class Get extends BaseCommand<typeof Get> {
  static description = "Get app from the marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
  ];

  static flags = {
    'app-uid': flags.string({
      description: commonMsg.APP_UID,
    }),
    'app-type': flags.string({
      default: "stack",
      options: ["stack", "organization"],
      description: commonMsg.APP_TYPE_DESCRIPTION
    })
  };

  async run(): Promise<void> {
    try {
      this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
      let app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
      await writeFile(this.flags['data-dir'], this.flags['yes'], app, this.log)
    } catch(error: any) {
      this.log(error.message, "error")
      this.exit()
    }
  }

}
