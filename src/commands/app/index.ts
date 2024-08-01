import { resolve } from "path";
import { exec } from "child_process";
import { Command } from "@contentstack/cli-utilities";

import { print } from "../../util/log";

export default class App extends Command {
  static description = "Apps CLI plugin";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>:create",
    "$ <%= config.bin %> <%= command.id %>:delete",
    "$ <%= config.bin %> <%= command.id %>:deploy",
    "$ <%= config.bin %> <%= command.id %>:get",
    "$ <%= config.bin %> <%= command.id %>:install",
    "$ <%= config.bin %> <%= command.id %>:reinstall",
    "$ <%= config.bin %> <%= command.id %>:uninstall",
    "$ <%= config.bin %> <%= command.id %>:update",
  ];

  async run(): Promise<void> {
    exec(
      `${resolve(process.cwd(), "bin", "run")} app --help`,
      (_er, stdout, _stderr) => {
        if (stdout) {
          this.log(`\n${stdout}`);
        } else {
          print([
            {
              bold: true,
              color: "yellow",
              message: `\nUse '${this.config.bin} app --help' command to see more info\n`,
            },
          ]);
        }
      }
    );
  }
}
