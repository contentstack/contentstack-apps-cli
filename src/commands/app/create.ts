import * as tmp from "tmp";
import { join } from "path";
import AdmZip from "adm-zip";
import pick from "lodash/pick";
import * as shell from "shelljs";
import merge from "lodash/merge";
import isEmpty from "lodash/isEmpty";
import { AppData } from "@contentstack/management/types/app";
import { renameSync, writeFileSync, createWriteStream } from "fs";
import { ux, cliux, flags, HttpClient } from "@contentstack/cli-utilities";

import { appCreate } from "../../messages";
import { BaseCommand } from "./base-command";
import { AppManifest, AppType } from "../../types";
import { getAppName, getOrg, getOrgAppUiLocation } from "../../util";

export default class Create extends BaseCommand<typeof Create> {
  private appData!: AppManifest;

  static description = "Create new app in marketplace app";

  static examples = ["$ <%= config.bin %> <%= command.id %>"];

  static flags = {
    name: flags.string({
      char: "n",
      default: appCreate.DEFAULT_APP_NAME,
      description: appCreate.NAME_DESCRIPTION,
    }),
    "app-type": flags.string({
      default: "stack",
      options: ["stack", "organization"],
      description: appCreate.APP_TYPE_DESCRIPTION,
    }),
  };

  async run(): Promise<void> {
    this.sharedConfig.org = this.flags.org;
    this.sharedConfig.appName = this.flags.name;
    this.appData = require(this.sharedConfig.manifestPath);

    await this.flagsPromptQueue();

    this.appData.name = this.sharedConfig.appName;
    this.appData.target_type = this.flags["app-type"] as AppType;

    if (this.flags["app-type"] === AppType.ORGANIZATION) {
      this.appData.ui_location.locations = getOrgAppUiLocation();
    }

    if (
      this.flags.yes ||
      (await cliux.inquire({
        type: "confirm",
        name: "cloneBoilerplate",
        message: this.messages.CONFIRM_CLONE_BOILERPLATE,
      }))
    ) {
      await this.boilerplateFlow();
    } else {
      ux.action.start(
        this.$t(this.messages.REGISTER_THE_APP_ON_DEVELOPER_HUB, {
          appName: this.sharedConfig.appName,
        })
      );
      await this.registerTheAppOnDeveloperHub(false);
      ux.action.stop();
    }
  }

  /**
   * @method boilerplateFlow
   *
   * @memberof Create
   */
  async boilerplateFlow() {
    // NOTE Step 1: download the boilerplate app from GitHub
    ux.action.start(this.messages.CLONE_BOILERPLATE);
    await this.unZipBoilerplate(await this.cloneBoilerplate());
    tmp.setGracefulCleanup(); // NOTE If graceful cleanup is set, tmp will remove all controlled temporary objects on process exit
    ux.action.stop();

    // NOTE Step 2: Registering the app
    ux.action.start(
      this.$t(this.messages.REGISTER_THE_APP_ON_DEVELOPER_HUB, {
        appName: this.sharedConfig.appName,
      })
    );
    await this.registerTheAppOnDeveloperHub();
    ux.action.stop();

    // NOTE Step 3: Install dependencies
    ux.action.start(this.messages.INSTALL_DEPENDENCIES);
    await this.installDependencies();
    ux.action.stop();
  }

  /**
   * @method promptQueue
   *
   * @memberof Create
   */
  async flagsPromptQueue() {
    if (isEmpty(this.sharedConfig.appName)) {
      this.sharedConfig.appName = await getAppName();
    }

    this.sharedConfig.org = await getOrg(this.flags, {
      log: this.log,
      managementSdk: this.managementSdk,
    });
  }

  /**
   * @method cloneBoilerplate
   *
   * @return {*}  {Promise<string>}
   * @memberof Create
   */
  async cloneBoilerplate(): Promise<string> {
    const tmpObj = tmp.fileSync();
    const filePath = tmpObj.name;
    const writer = createWriteStream(filePath);
    const response = await new HttpClient({ responseType: "stream" }).get(
      this.sharedConfig.appBoilerplateGithubUrl
    );
    response.data.pipe(writer);

    return new Promise((resolve) => {
      writer
        .on("finish", function () {
          resolve(filePath);
        })
        .on("error", () => {
          this.log(this.messages.FILE_GENERATION_FAILURE, "error");
          this.exit(1);
        });
    });
  }

  /**
   * @method unZipBoilerplate
   *
   * @param {string} filepath
   * @memberof Create
   */
  async unZipBoilerplate(filepath: string) {
    const zip = new AdmZip(filepath);
    await new Promise<void>((resolve) => {
      zip.extractAllToAsync(process.cwd(), true, false, (error) => {
        if (!error) {
          renameSync(
            join(process.cwd(), this.sharedConfig.boilerplateName),
            join(process.cwd(), this.sharedConfig.appName)
          );
          // NOTE write manifest into Boilerplate location
          return resolve();
        }

        this.log(error.message, "error");
        this.exit(1);
      });
    });
  }

  /**
   * @method registerTheAppOnDeveloperHub
   *
   * @param {boolean} [saveManifest=true]
   * @memberof Create
   */
  async registerTheAppOnDeveloperHub(saveManifest: boolean = true) {
    await this.managementAppSdk
      .organization(this.sharedConfig.org)
      .app()
      .create(this.appData as AppData)
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
        this.appData = merge(this.appData, pick(response, validKeys));
        if (saveManifest) {
          writeFileSync(
            join(process.cwd(), this.sharedConfig.appName, "manifest.json"),
            JSON.stringify(this.appData),
            {
              encoding: "utf8",
              flag: "w",
            }
          );
        }
        this.log(this.messages.APP_CREATION_SUCCESS, "info");
      })
      .catch((error) => {
        if (error.errorMessage) this.log(error.errorMessage, "error");
        switch (error.status) {
          case 400:
            this.log(this.messages.APP_CREATION_CONSTRAINT_FAILURE, "error");
            break;
          case 403:
            this.log(this.messages.APP_CREATION_INVALID_ORG, "error");
            break;
          case 409:
            this.log(this.messages.DUPLICATE_APP_NAME, "error");
            break;
          default:
            this.log(
              this.$t(this.messages.APP_CREATION_FAILURE, {
                appName: this.appData.name,
              }),
              "error"
            );
            break;
        }

        this.log(error, "error");
        this.exit(1);
      });
  }

  /**
   * @method installDependencies
   *
   * @memberof Create
   */
  async installDependencies() {
    shell.cd(join(process.cwd(), this.sharedConfig.appName));
    await new Promise<void>((resolve, reject) => {
      shell.exec("npm install", { silent: true }, (error) => {
        if (error !== 0) {
          return reject(error);
        }
        resolve();
      });
    });
  }
}
