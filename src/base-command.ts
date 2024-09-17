import omit from "lodash/omit";
import merge from "lodash/merge";
import { existsSync, readFileSync } from "fs";
import { Command } from "@contentstack/cli-command";
import {
  Flags,
  FlagInput,
  Interfaces,
  cliux as ux,
  ContentstackClient,
  managementSDKClient,
  managementSDKInitiator,
  InquirePayload,
  cliux,
  isAuthenticated,
  ContentstackMarketplaceClient,
  marketplaceSDKInitiator,
  marketplaceSDKClient,
} from "@contentstack/cli-utilities";

import config from "./config";
import { ConfigType, LogFn } from "./types";
import { Logger, getDeveloperHubUrl } from "./util";
import messages, { $t, commonMsg } from "./messages";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)["baseFlags"] & T["flags"]
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  public log!: LogFn;
  public logger!: Logger;
  public readonly $t = $t;
  public developerHubBaseUrl!: string;
  protected sharedConfig: ConfigType = {
    ...config,
    projectBasePath: process.cwd(),
  };
  readonly messages: typeof messages = {
    ...messages,
  };
  protected managementSdk!: ContentstackClient;
  protected managementAppSdk!: ContentstackClient;
  protected marketplaceAppSdk!: ContentstackMarketplaceClient;

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  // NOTE define flags that can be inherited by any command that extends BaseCommand
  static baseFlags: FlagInput = {
    org: Flags.string({
      description: commonMsg.PROVIDE_ORG_UID,
    }),
    yes: Flags.boolean({
      char: "y",
      hidden: true,
      description: commonMsg.SKIP_CONFIRMATION,
    }),
  };

  public async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;

    ux.registerSearchPlugin();
    this.registerConfig();
    // Init logger
    const logger = new Logger(this.sharedConfig);
    this.log = logger.log.bind(logger);

    this.validateRegionAndAuth();

    this.developerHubBaseUrl = this.sharedConfig.developerHubBaseUrl;
    if (this.developerHubUrl && this.developerHubUrl.startsWith("https://")) {
      this.developerHubBaseUrl = this.developerHubUrl.replace("https://", "");
    }
    if (!this.developerHubBaseUrl)
      this.developerHubBaseUrl = getDeveloperHubUrl();
    await this.initCmaSDK();
    await this.initMarketplaceSDK();
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err);
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }

  /**
   * @method registerConfig
   *
   * @memberof BaseCommand
   */
  registerConfig() {
    if (this.flags.config && existsSync(this.flags.config)) {
      try {
        const config = JSON.parse(
          readFileSync(this.flags.config, { encoding: "utf-8" })
        );
        const omitKeys = [
          "manifestPath",
          "boilerplateName",
          "developerHubUrls",
        ];
        this.sharedConfig = merge(this.sharedConfig, omit(config, omitKeys));
      } catch (error) {}
    }
  }

  /**
   * @method initCmaSDK
   *
   * @memberof BaseCommand
   */
  async initCmaSDK() {
    managementSDKInitiator.init(this.context);
    this.managementSdk = await managementSDKClient({
      host: this.cmaHost,
    });
    this.managementAppSdk = await managementSDKClient({
      host: this.developerHubBaseUrl,
    });
  }

  async initMarketplaceSDK() {
    marketplaceSDKInitiator.init(this.context);
    this.marketplaceAppSdk = await marketplaceSDKClient({
      host: this.developerHubBaseUrl,
    });
  }

  /**
   * @method getValPrompt
   *
   * @param {(Partial<InquirePayload> & Record<string, any>)} [options={
   *       validate: (val) => {
   *         if (!val) return this.messages.NOT_EMPTY;
   *         return true;
   *       },
   *     }]
   * @return {*}  {(Promise<string | boolean>)}
   * @memberof BaseCommand
   */
  getValPrompt(
    options: Partial<InquirePayload> & Record<string, any> = {
      message: "Enter value",
      validate: (val) => {
        if (!val) return this.$t(this.messages.NOT_EMPTY, { value: "Value" });
        return true;
      },
    }
  ): Promise<string | boolean> {
    const { name = "getVal", message, validate } = options;
    return cliux.inquire({
      validate,
      name,
      type: "input",
      default: options?.default,
      message: message as string,
    });
  }

  /**
   * The `validateRegionAndAuth` function verify whether region is set and user is logged in or not
   */
  validateRegionAndAuth() {
    if (this.region) {
      if (!isAuthenticated()) {
        this.log(this.messages.CLI_APP_CLI_LOGIN_FAILED, "error");
        this.exit(1);
      }
    }
  }
}
