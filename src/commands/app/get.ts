import { BaseCommand } from "./base-command";
import { getOrg, getApp, writeFile } from "../../util";
import { flags } from "@contentstack/cli-utilities";

export default class Get extends BaseCommand<typeof Get> {
  static description = "Get app from the marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
  ];

  static flags = {
    'app-uid': flags.string({
      description: "something",
    }),
    'org-uid': flags.string({
      description: "something"
    })
  };

  async run(): Promise<void> {
    this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
    let app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
    
  }

}
