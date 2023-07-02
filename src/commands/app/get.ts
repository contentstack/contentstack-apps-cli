import { BaseCommand } from "./base-command";
import { getOrg, getApp, writeFile } from "../../util";
import { flags } from "@contentstack/cli-utilities";

export default class Get extends BaseCommand<typeof Get> {
  static description = "Get app from the marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
  ];

  static flags = {
    'app': flags.string({
      description: "App UID",
    }),
    'org': flags.string({
      description: "Organization UID"
    }),
    'data-dir': flags.string({
      description: "Path to the directory where the data will be saved",
      default: "."
    }),
    'app-type': flags.string({
      default: "stack",
      options: ["stack", "organization"],
      description: "Type of app"
    })
  };

  async run(): Promise<void> {
    try {
      this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
      let app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
      await writeFile(this.flags['data-dir'], app, this.log)
    } catch(error: any) {
      this.log(error.message, "error")
      this.exit()
    }
  }

}
