import { Command } from "@contentstack/cli-utilities";

import { print } from "../../util/log";

export default class App extends Command {
  static description = "Apps CLI plugin";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>:create",
    "$ <%= config.bin %> <%= command.id %>:get",
    "$ <%= config.bin %> <%= command.id %>:update",
    "$ <%= config.bin %> <%= command.id %>:delete",
  ];

  async run(): Promise<void> {
    print([
      {
        bold: true,
        color: "yellow",
        message: `\nUse '${this.config.bin} app --help' command to see more info\n`,
      },
    ]);
  }
}
