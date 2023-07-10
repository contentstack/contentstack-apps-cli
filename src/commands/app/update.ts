import { flags } from "@contentstack/cli-utilities";

import { AppManifest } from "../../types";
import { BaseCommand } from "./base-command";
import { $t, appUpdate } from "../../messages";
import { existsSync, readFileSync } from "fs";

export default class Create extends BaseCommand<typeof Create> {
  private appUidRetry: number = 0;
  private manifestPathRetry: number = 0;
  private manifestData!: AppManifest & Record<string, any>;
  static description = "Update the existing app in developer hub";

  static examples = ["$ <%= config.bin %> <%= command.id %>"];

  static flags = {
    "app-uid": flags.string({
      required: true,
      description: appUpdate.APP_UID,
    }),
    "app-manifest": flags.string({
      required: true,
      description: $t(appUpdate.FILE_PATH, { fileName: "app-manifest.json" }),
    }),
  };

  async run(): Promise<void> {
    await this.flagsPromptQueue();
    await this.validateManifest();
    await this.validateAppUid();
  }

  /**
   * @method flagsPromptQueue
   *
   * @memberof Create
   */
  async flagsPromptQueue() {
    const validate = (value: string) => {
      return (val: string) => {
        if (!val) return this.$t(this.messages.NOT_EMPTY, { value });
        return true;
      };
    };

    if (!this.flags["app-uid"]) {
      this.flags["app-uid"] = (await this.getValPrompt({
        validate: validate("App UID"),
        message: this.messages.APP_UID,
      })) as string;
    }

    if (!this.flags["app-manifest"]) {
      this.flags["app-manifest"] = (await this.getValPrompt({
        validate: validate("App manifest path"),
        message: this.$t(this.messages.FILE_PATH, {
          fileName: "app-manifest.json",
        }),
      })) as string;
    }
  }

  /**
   * @method validateManifest
   *
   * @memberof Create
   */
  async validateManifest() {
    let hasError = false;
    if (existsSync(this.flags["app-manifest"])) {
      try {
        this.manifestData = JSON.parse(
          readFileSync(this.flags.config, { encoding: "utf-8" })
        );
      } catch (error) {
        hasError = true;
        this.log(error, "error");
      }
    } else {
      hasError = true;
      this.$t(this.messages.PATH_NOT_FOUND, {
        path: this.flags["app-manifest"],
      });
    }

    if (hasError) {
      this.manifestPathRetry++;

      if (this.manifestPathRetry < 3) {
        this.flags["app-manifest"] = "";
        await this.flagsPromptQueue();
      } else {
        this.log(this.messages.MAX_RETRY_LIMIT, "warn");
        this.exit(1);
      }
    }
  }

  /**
   * @method validateAppUid
   *
   * @memberof Create
   */
  async validateAppUid() {
    if (this.flags["app-uid"] !== this.manifestData.uid) {
      this.log(this.messages.APP_UID_NOT_MATCH, "error");
      this.appUidRetry++;

      if (this.appUidRetry < 3) {
        this.flags["app-uid"] = "";
        await this.flagsPromptQueue();
      } else {
        this.log(this.messages.MAX_RETRY_LIMIT, "warn");
        this.exit(1);
      }
    }
  }
}
