import { BaseCommand } from "./base-command";
// import { getOrg } from "../../util";
import { flags } from "@contentstack/cli-utilities";

export default class Get extends BaseCommand<typeof Get> {
  static description = "Get app from the marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
  ];

  static flags = {
    'app-uid': flags.string({
      description: "",
    }),
    'org-uid': flags.string({
      description: ""
    })
  };

  async run(): Promise<void> {
    // this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementAppSdk, log: this.log});
    let apps = await this.getAllAppsFromOrg()
    console.log(apps)
  }

  async getAllAppsFromOrg(): Promise<any> {
    return this.managementAppSdk
    .organization(this.sharedConfig.org)
    .app()
    .findAll()
  }
}
