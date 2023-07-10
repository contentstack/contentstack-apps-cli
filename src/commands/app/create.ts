import * as tmp from "tmp";
import { dirname, join } from "path";
import AdmZip from "adm-zip";
import pick from "lodash/pick";
import * as shell from "shelljs";
import merge from "lodash/merge";
import isEmpty from "lodash/isEmpty";
import { AppData } from "@contentstack/management/types/app";
import {
  rmSync,
  mkdirSync,
  renameSync,
  existsSync,
  writeFileSync,
  createWriteStream,
} from "fs";
import { ux, cliux, flags, HttpClient } from "@contentstack/cli-utilities";

import { appCreate } from "../../messages";
import { BaseCommand } from "./base-command";
import { AppManifest, AppType } from "../../types";
import {
  getOrg,
  getAppName,
  getDirName,
  getOrgAppUiLocation,
} from "../../util";

export default class Create extends BaseCommand<typeof Create> {
  private appData!: AppManifest;

  static description = "Create new app in marketplace app";

  static examples = ["$ <%= config.bin %> <%= command.id %>"];

  static flags = {
    name: flags.string({
      char: "n",
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
      await this.registerTheAppOnDeveloperHub(false);
    }
  }

  /**
   * @method boilerplateFlow
   *
   * @memberof Create
   */
  async boilerplateFlow() {
    // NOTE Step 1: download the boilerplate app from GitHub
    await this.unZipBoilerplate(await this.cloneBoilerplate());
    tmp.setGracefulCleanup(); // NOTE If graceful cleanup is set, tmp will remove all controlled temporary objects on process exit

    // NOTE Step 2: Registering the app
    await this.registerTheAppOnDeveloperHub();

    // NOTE Step 3: Install dependencies
    ux.action.start(this.messages.INSTALL_DEPENDENCIES);
    await this.installDependencies();
    ux.action.stop();
    this.log(
      this.$t(this.messages.START_APP_COMMAND, {
        command: `cd ${this.sharedConfig.folderPath} && npm run start`,
      }),
      "info"
    );
  }

  /**
   * @method promptQueue
   *
   * @memberof Create
   */
  async flagsPromptQueue() {
    if (isEmpty(this.sharedConfig.appName)) {
      this.sharedConfig.appName = await getAppName(
        this.messages.DEFAULT_APP_NAME
      );
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
    ux.action.start(this.messages.CLONE_BOILERPLATE);
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
          ux.action.stop();
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
    const dataDir = this.flags["data-dir"] || process.cwd();
    let targetPath = join(dataDir, this.sharedConfig.appName);
    const sourcePath = join(dataDir, this.sharedConfig.boilerplateName);

    if (this.flags["data-dir"] && !existsSync(this.flags["data-dir"])) {
      mkdirSync(this.flags["data-dir"], { recursive: true });
    }

    if (existsSync(targetPath)) {
      this.log(this.messages.DIR_EXIST, "warn");
      targetPath = await getDirName(targetPath);
    }

    this.sharedConfig.folderPath = targetPath;

    await new Promise<void>((resolve) => {
      ux.action.start(this.messages.UNZIP);
      zip.extractAllToAsync(dataDir, true, false, (error) => {
        ux.action.stop();

        if (!error) {
          renameSync(sourcePath, targetPath);
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
  async registerTheAppOnDeveloperHub(saveManifest: boolean = true, retry = 0) {
    ux.action.start(
      this.$t(this.messages.REGISTER_THE_APP_ON_DEVELOPER_HUB, {
        appName: this.sharedConfig.appName,
      })
    );
    await this.managementAppSdk
      .organization(this.sharedConfig.org)
      .app()
      .create(this.appData as AppData)
      .then((response) => {
        ux.action.stop();

        if (this.sharedConfig.nameChanged) {
          renameSync(
            this.sharedConfig.oldFolderPath,
            this.sharedConfig.folderPath
          );
        }

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
            join(this.sharedConfig.folderPath, "manifest.json"),
            JSON.stringify(this.appData),
            {
              encoding: "utf8",
              flag: "w",
            }
          );
        }
        this.log(this.messages.APP_CREATION_SUCCESS, "info");
      })
      .catch(async (error) => {
        ux.action.stop("Failed");
        switch (error.status) {
          case 400:
            this.log(this.messages.APP_CREATION_CONSTRAINT_FAILURE, "error");
            break;
          case 403:
            this.log(this.messages.APP_CREATION_INVALID_ORG, "error");
            break;
          case 409:
            this.log(
              this.$t(this.messages.DUPLICATE_APP_NAME, {
                appName: this.appData.name,
              }),
              "warn"
            );
            return await this.manageNameConflict(saveManifest, retry);
          default:
            this.log(
              this.$t(this.messages.APP_CREATION_FAILURE, {
                appName: this.appData.name,
              }),
              "error"
            );
            break;
        }

        await this.rollbackBoilerplate();

        if (error.errorMessage) {
          this.log(error.errorMessage, "error");
        }
        this.log(error, "error");
        this.exit(1);
      });
  }

  /**
   * @method rollbackBoilerplate
   *
   * @memberof Create
   */
  rollbackBoilerplate() {
    if (existsSync(this.sharedConfig.folderPath)) {
      ux.action.start(this.messages.ROLLBACK_BOILERPLATE);
      rmSync(this.sharedConfig.folderPath, {
        force: true,
        recursive: true,
        maxRetries: 3,
      });
      ux.action.stop();
    }
  }

  /**
   * @method manageNameConflict
   *
   * @param {boolean} saveManifest
   * @param {number} retry
   * @return {*}  {Promise<void>}
   * @memberof Create
   */
  async manageNameConflict(
    saveManifest: boolean,
    retry: number
  ): Promise<void> {
    this.sharedConfig.appName = await getAppName(
      `${this.sharedConfig.appName}+${retry + 1}`
    );
    this.appData.name = this.sharedConfig.appName;

    if (!this.sharedConfig.oldFolderPath) {
      this.sharedConfig.oldFolderPath = this.sharedConfig.folderPath;
    }

    this.sharedConfig.folderPath = join(
      dirname(this.sharedConfig.folderPath),
      this.appData.name
    );
    this.sharedConfig.nameChanged = true;

    return await this.registerTheAppOnDeveloperHub(saveManifest, retry);
  }

  /**
   * @method installDependencies
   *
   * @memberof Create
   */
  async installDependencies() {
    shell.cd(this.sharedConfig.folderPath);
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
