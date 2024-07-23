import * as tmp from "tmp";
import AdmZip from "adm-zip";
import omit from "lodash/omit";
import pick from "lodash/pick";
import * as shell from "shelljs";
import merge from "lodash/merge";
import isEmpty from "lodash/isEmpty";
import { dirname, resolve } from "path";
import { AppData } from "@contentstack/management/types/app";
import {
  rmSync,
  mkdirSync,
  renameSync,
  existsSync,
  writeFileSync,
  createWriteStream,
} from "fs";
import {
  ux,
  cliux,
  flags,
  HttpClient,
  configHandler,
  FlagInput,
} from "@contentstack/cli-utilities";

import { BaseCommand } from "../../base-command";
import { AppManifest, AppType, BoilerplateAppType } from "../../types";
import { appCreate, commonMsg } from "../../messages";
import {
  getOrg,
  getAppName,
  getDirName,
  getOrgAppUiLocation,
  sanitizePath,
  selectedBoilerplate,
  validateBoilerplate,
} from "../../util";

export default class Create extends BaseCommand<typeof Create> {
  private appData!: AppManifest;
  private tempAppData = {
    name: "",
    target_type: "",
    ui_location: { locations: undefined },
  } as any;

  static description =
    "Create a new app in Developer Hub and optionally clone a boilerplate locally.";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --name App-1 --app-type stack",
    "$ <%= config.bin %> <%= command.id %> --name App-2 --app-type stack -d ./boilerplate",
    "$ <%= config.bin %> <%= command.id %> --name App-3 --app-type organization --org <UID> -d ./boilerplate -c ./external-config.json",
    "$ <%= config.bin %> <%= command.id %> --name App-4 --app-type organization --org <UID> --boilerplates <boilerplate-name>",
  ];

  static flags: FlagInput = {
    name: flags.string({
      char: "n",
      default: "app-boilerplate",
      description: appCreate.NAME_DESCRIPTION,
    }),
    "app-type": flags.string({
      default: "stack",
      options: ["stack", "organization"],
      description: appCreate.APP_TYPE_DESCRIPTION,
    }),
    config: flags.string({
      char: "c",
      description: commonMsg.CONFIG,
    }),
    "data-dir": flags.string({
      char: "d",
      description: commonMsg.CURRENT_WORKING_DIR,
    }),
    "boilerplate": flags.string({
      description: appCreate.BOILERPLATE_TEMPLATES,
    }),
  };

  async run(): Promise<void> {
    this.sharedConfig.org = this.flags.org;
    this.sharedConfig.appName = this.flags.name;
    this.sharedConfig.boilerplateName = this.flags.boilerplate;

    await this.flagsPromptQueue();

    this.tempAppData.name = this.sharedConfig.appName;
    this.tempAppData.target_type = this.flags["app-type"] as AppType;

    if (this.flags["app-type"] === AppType.ORGANIZATION) {
      this.tempAppData.ui_location.locations = getOrgAppUiLocation();
    }

    try {
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
        this.manageManifestToggeling();
        await this.registerTheAppOnDeveloperHub(false);
      }
    } catch (error: Error | any) {
      if (error?.errorMessage || error?.message || !isEmpty(error)) {
        this.log(error?.errorMessage || error?.message || error, "error");
      }

      this.exit(1);
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

    this.manageManifestToggeling();

    // NOTE Step 2: Registering the app
    await this.registerTheAppOnDeveloperHub();

    // NOTE Step 3: Install dependencies
    ux.action.start(this.messages.INSTALL_DEPENDENCIES);
    await this.installDependencies();
    ux.action.stop();
    this.log(
      this.$t(this.messages.START_APP_COMMAND, {
        command: `cd "${this.sharedConfig.folderPath}" && npm run start`,
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
        this.sharedConfig.defaultAppName
      );
    }
    if (isEmpty(this.sharedConfig.boilerplateName)) {
      const boilerplate: BoilerplateAppType = await selectedBoilerplate();

      if (boilerplate) {
        this.sharedConfig.boilerplateName = boilerplate.name
          .toLowerCase()
          .replace(/ /g, "-");
        this.sharedConfig.appBoilerplateGithubUrl = boilerplate.link;
        this.sharedConfig.appName = await getAppName(
          this.sharedConfig.boilerplateName
        );
      }
    } else {
      await validateBoilerplate(this.sharedConfig.boilerplateName);
    }
    this.sharedConfig.appName = this.sharedConfig.boilerplateName;

    //Auto select org in case of oauth
    this.sharedConfig.org =
      configHandler.get("oauthOrgUid") ??
      (await getOrg(this.flags, {
        log: this.log,
        managementSdk: this.managementSdk,
      }));
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

    response?.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer
        .on("finish", function () {
          resolve(filePath);
          ux.action.stop();
        })
        .on("error", () => {
          reject(this.messages.FILE_GENERATION_FAILURE);
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
    const dataDir = this.flags["data-dir"] ?? process.cwd();
    let targetPath = resolve(dataDir, this.sharedConfig.appName);

    // Get the directory inside the zip file
    const zipEntries = zip.getEntries();
    const firstEntry = zipEntries[0];
    const sourcePath = resolve(dataDir, firstEntry.entryName.split("/")[0]);

    if (this.flags["data-dir"] && !existsSync(this.flags["data-dir"])) {
      mkdirSync(this.flags["data-dir"], { recursive: true });
    }

    if (existsSync(targetPath)) {
      this.log(this.messages.DIR_EXIST, "warn");
      targetPath = await getDirName(targetPath);
    }

    this.sharedConfig.folderPath = targetPath;

    await new Promise<void>((resolve, reject) => {
      ux.action.start(this.messages.UNZIP);
      zip.extractAllToAsync(dataDir, true, false, (error) => {
        ux.action.stop();

        if (!error) {
          renameSync(sourcePath, targetPath);
          // NOTE write manifest into Boilerplate location
          return resolve();
        }

        reject(error);
      });
    });
  }

  /**
   * @method manageManifestToggeling
   *
   * The function manages toggling of the manifest file based on the app type, removing the
   * "ui_location" property if the app type is an organization.
   */
  manageManifestToggeling() {
    // NOTE Use boilerplate manifest if exist
    const manifestPath = resolve(this.sharedConfig.folderPath, "manifest.json");

    if (existsSync(manifestPath)) {
      this.sharedConfig.manifestPath = manifestPath;
    }

    let manifest = require(this.sharedConfig.manifestPath);

    if (this.flags["app-type"] === AppType.ORGANIZATION) {
      manifest = omit(manifest, ["ui_location"]);
    } else {
      this.tempAppData = omit(this.tempAppData, ["ui_location"]);
    }

    this.appData = merge(manifest, this.tempAppData);
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
    await this.marketplaceAppSdk
      .marketplace(this.sharedConfig.org)
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
            resolve(this.sharedConfig.folderPath, "manifest.json"),
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
            this.log(this.messages.APP_INVALID_ORG, "error");
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

        this.rollbackBoilerplate();

        if (error.errorMessage) {
          this.log(error.errorMessage, "error");
        }

        throw error;
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

    this.sharedConfig.folderPath = resolve(
      dirname(this.sharedConfig.folderPath),
      sanitizePath(this.appData.name)
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
