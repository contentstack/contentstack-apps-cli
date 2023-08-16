import pick from "lodash/pick";
import merge from "lodash/merge";
import isEmpty from "lodash/isEmpty";
import { flags } from "@contentstack/cli-utilities";
import { App } from "@contentstack/management/types/app";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { AppManifest } from "../../types";
import { BaseCommand } from "./base-command";
import { $t, appUpdate } from "../../messages";
import { fetchApp, getApp, getOrg } from "../../util";

export default class Update extends BaseCommand<typeof Update> {
  private orgUid!: string;
  private manifestPathRetry: number = 0;
  private manifestData!: AppManifest & Record<string, any>;

  static hidden: boolean = false;

  static description = "Update the existing app in developer hub";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --app-manifest ./boilerplate/manifest.json",
  ];

  static flags = {
    "app-manifest": flags.string({
      description: $t(appUpdate.FILE_PATH, { fileName: "app manifest.json" }),
    }),
  };

  async run(): Promise<void> {
    try {
      await this.validateManifest();
      this.orgUid = this.flags.org || this.manifestData.organization_uid;
      this.sharedConfig.org = await getOrg(
        { org: this.orgUid as any },
        {
          log: this.log,
          managementSdk: this.managementSdk,
        }
      );
      await this.validateAppUidAndVersion();
      await this.updateAppOnDeveloperHub();
    } catch (error: Error | any) {
      if (error?.errorMessage || error?.message || !isEmpty(error)) {
        this.log(error?.errorMessage || error?.message || error, "error");
      }

      this.exit(1);
    }
  }

  /**
   * @method validateManifest
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async validateManifest(): Promise<void> {
    if (!this.flags["app-manifest"]) {
      this.flags["app-manifest"] = (await this.getValPrompt({
        name: "appManifest",
        validate: (val: string) => {
          if (!val)
            return this.$t(this.messages.NOT_EMPTY, {
              value: "App manifest path",
            });
          return true;
        },
        message: this.$t(this.messages.FILE_PATH, {
          fileName: "app manifest.json",
        }),
      })) as string;
    }

    const manifestPath = this.flags["app-manifest"];
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
        await this.validateManifest();
      } else {
        this.log(this.messages.MAX_RETRY_LIMIT, "warn");
        throw new Error();
      }
    }
  }

  /**
   * @method validateAppUidAndVersion
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async validateAppUidAndVersion(): Promise<void> {
    let appData;

    if (!this.manifestData.uid) {
      appData = (await getApp(this.flags, this.orgUid, {
        managementSdk: this.managementAppSdk,
        log: this.log,
      })) as App;
      this.manifestData.uid = appData.uid;
    } else {
      appData = await fetchApp(
        { "app-uid": this.manifestData.uid as any },
        this.orgUid,
        {
          managementSdk: this.managementAppSdk,
          log: this.log,
        }
      );
    }

    if (appData.uid !== this.manifestData?.uid) {
      this.log(this.messages.APP_UID_NOT_MATCH, "error");
      this.manifestData.uid = "";
      return await this.validateAppUidAndVersion();
    }

    if (appData?.version !== this.manifestData.version) {
      this.log(this.messages.APP_VERSION_MISS_MATCH, "warn");
      throw new Error();
    }
  }

  /**
   * @method updateAppOnDeveloperHub
   *
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async updateAppOnDeveloperHub(): Promise<void> {
    let app = this.managementAppSdk
      .organization(this.orgUid)
      .app(this.manifestData.uid);

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

        throw er;
      });
  }
}
