import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

import config from "./config";
import { AppManifest } from "./types";
import { BaseCommand } from "./base-command";

export abstract class AppCLIBaseCommand extends BaseCommand<
  typeof AppCLIBaseCommand
> {
  protected manifestPath!: string;
  protected manifestData!: AppManifest & Record<string, any>;

  public async init(): Promise<void> {
    await super.init();
    this.getManifestData();
  }

  getManifestData() {
    this.manifestPath = resolve(process.cwd(), `${config.defaultAppFileName}.json`);
    if (existsSync(this.manifestPath)) {
      try {
        this.manifestData = JSON.parse(
          readFileSync(this.manifestPath, {
            encoding: "utf-8",
          })
        );
      } catch (error) {
        throw error;
      }
    }
  }
}
