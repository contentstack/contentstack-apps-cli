import { flags } from "@contentstack/cli-utilities";

import { BaseCommand } from "./base-command";
import { appUpdate } from "../../messages";

export default class Create extends BaseCommand<typeof Create> {
  static description = "Update the existing app in developer hub";

  static examples = ["$ <%= config.bin %> <%= command.id %>"];

  static flags = {
    "app-uid": flags.string({
      char: "n",
      description: appUpdate.APP_UID,
    }),
    "app-manifest": flags.string({
      description: appUpdate.MANIFEST_PATH,
    }),
  };

  async run(): Promise<void> {}
}
