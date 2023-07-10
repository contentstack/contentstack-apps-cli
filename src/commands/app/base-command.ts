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
} from "@contentstack/cli-utilities";

import config from "../../config";
import { ConfigType, LogFn } from "../../types";
import { Logger, getDeveloperHubUrl } from "../../util";
import messages, { $t, commonMsg } from "../../messages";

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

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  static hidden = true;

  // NOTE define flags that can be inherited by any command that extends BaseCommand
  static baseFlags: FlagInput = {
    config: Flags.string({
      char: "c",
      description: commonMsg.CONFIG,
    }),
    org: Flags.string({
      description: commonMsg.PROVIDE_ORG_UID,
    }),
    "data-dir": Flags.string({
      char: "d",
      description: commonMsg.CURRENT_WORKING_DIR,
    }),
    yes: Flags.boolean({
      char: "y",
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

    this.developerHubBaseUrl =
      this.sharedConfig.developerHubBaseUrl || (await getDeveloperHubUrl());
    await this.initCmaSDK();

    // Init logger
    const logger = new Logger(this.sharedConfig);
    this.log = logger.log.bind(logger);
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
        const omitKeys = ["boilerplateName", "manifestPath"];
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
}
