import { BaseCommand } from "./base-command";

export default class Create extends BaseCommand<typeof Create> {
  static description = "Create new app in marketplace app";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
  ];

  static flags = {};

  async run(): Promise<void> {}
}
