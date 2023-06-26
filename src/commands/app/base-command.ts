import EventEmitter from "events";
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
import { Logger } from "../../util";
import messages, { $t } from "../../messages";
import { ConfigType, LogFn } from "../../types";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)["baseFlags"] & T["flags"]
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  public log!: LogFn;
  public logger!: Logger;
  public readonly $t = $t;
  protected $event!: EventEmitter;
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

  // static hidden = true;

  // define flags that can be inherited by any command that extends BaseCommand
  static baseFlags: FlagInput = {
    org: Flags.string({
      description: "Provide the organization UID",
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

    this.initCmaSDK();

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
      host: this.sharedConfig.developerHubBaseUrl,
    });
  }
}
