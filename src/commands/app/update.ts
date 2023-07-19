import pick from "lodash/pick";
import { resolve } from "path";
import merge from "lodash/merge";
import { flags } from "@contentstack/cli-utilities";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { getOrg } from "../../util";
import { AppManifest } from "../../types";
import { BaseCommand } from "./base-command";
import { $t, appUpdate } from "../../messages";

export default class Create extends BaseCommand<typeof Create> {
  private appUidRetry: number = 0;
  private manifestPathRetry: number = 0;
  private manifestData!: AppManifest & Record<string, any>;
  static description = "Update the existing app in developer hub";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value> --app-manifest <value>",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value> --app-manifest ./boilerplate/manifest.json",
    "$ <%= config.bin %> <%= command.id %> --org <value> --app-uid <value> -d ./boilerplate -c ./external-config.json --yes",
  ];

  static flags = {
    "app-uid": flags.string({
      description: appUpdate.APP_UID,
    }),
    "app-manifest": flags.string({
      description: $t(appUpdate.FILE_PATH, { fileName: "app manifest.json" }),
    }),
  };

  async run(): Promise<void> {
    if (this.flags["data-dir"] && !this.flags["app-manifest"]) {
      this.flags["app-manifest"] = resolve(
        this.flags["data-dir"],
        "manifest.json"
      );
    }

    await this.flagsPromptQueue();
    await this.validateManifest();
    await this.validateAppUid();
    await this.appVersionValidation();
    await this.updateAppOnDeveloperHub();
  }

  /**
   * @method flagsPromptQueue
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async flagsPromptQueue(): Promise<void> {
    const validate = (value: string) => {
      return (val: string) => {
        if (!val) return this.$t(this.messages.NOT_EMPTY, { value });
        return true;
      };
    };

    this.sharedConfig.org = await getOrg(this.flags, {
      log: this.log,
      managementSdk: this.managementSdk,
    });

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
          fileName: "app manifest.json",
        }),
      })) as string;
    }
  }

  /**
   * @method validateManifest
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async validateManifest(): Promise<void> {
    const manifestPath = this.flags["app-manifest"] as string;
    let hasError = false;
    if (existsSync(manifestPath)) {
      try {
        this.manifestData = JSON.parse(
          readFileSync(manifestPath, {
            encoding: "utf-8",
          })
        );
      } catch (error) {
        hasError = true;
        this.log(error, "error");
      }
    } else {
      hasError = true;
      this.$t(this.messages.PATH_NOT_FOUND, {
        path: manifestPath,
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
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async validateAppUid(): Promise<void> {
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

  /**
   * @method appVersionValidation
   *
   * @return {*}  {(Promise<Record<string, any> | void>)}
   * @memberof Create
   */
  async appVersionValidation(): Promise<Record<string, any> | void> {
    const app = await this.managementAppSdk
      .organization(this.flags.org)
      .app(this.flags["app-uid"] as string)
      .fetch()
      .catch((er) => {
        this.log(er, "error");
      });

    if (this.manifestData.version !== app?.version) {
      this.log(this.messages.APP_VERSION_MISS_MATCH, "warn");
      this.exit(1);
    }

    return app;
  }

  /**
   * @method updateAppOnDeveloperHub
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async updateAppOnDeveloperHub(): Promise<void> {
    let app = this.managementAppSdk
      .organization(this.flags.org)
      .app(this.flags["app-uid"] as string);

    app = Object.assign(app, this.manifestData);
    await app
      .update()
      .then((response) => {
        const validKeys = [
          "uid",
          "name",
          "icon",
          "oauth",
          "version",
          "visibility",
          "created_by",
          "created_at",
          "updated_by",
          "updated_at",
          "target_type",
          "description",
          "ui_location",
          "organization_uid",
          "framework_version",
        ];
        this.manifestData = merge(this.manifestData, pick(response, validKeys));
        writeFileSync(
          this.flags["app-manifest"] as string,
          JSON.stringify(this.manifestData),
          {
            encoding: "utf8",
            flag: "w",
          }
        );
        this.log(this.messages.APP_UPDATE_SUCCESS, "info");
      })
      .catch((er) => {
        switch (er.status) {
          case 400:
            this.log(this.messages.INVALID_APP_ID, "error");
            break;
          case 403:
            this.log(this.messages.APP_INVALID_ORG, "error");
            break;
          case 409:
            this.log(
              this.$t(this.messages.DUPLICATE_APP_NAME, {
                appName: this.manifestData.name,
              }),
              "warn"
            );
            break;
          default:
            this.log(this.messages.APP_UPDATE_FAILED, "warn");
            break;
        }

        this.log(er, "error");
        this.exit(1);
      });
  }
}
