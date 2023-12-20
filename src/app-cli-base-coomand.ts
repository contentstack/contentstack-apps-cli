import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

import config from "./config";
import { AppManifest } from "./types";
import { BaseCommand } from "./commands/app/base-command";

export abstract class AppCLIBaseCommand extends BaseCommand<
  typeof AppCLIBaseCommand
> {
  protected manifestPath!: string;
  protected manifestData!: AppManifest & Record<string, any>;

  /**
   * The `start` function call getManifestData which reads manifest file is current working directory is app directory
   */
  start() {
    this.getManifestData();
  }

  //move this into abstract command
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
