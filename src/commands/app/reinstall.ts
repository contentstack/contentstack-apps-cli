import { cliux, flags, FlagInput } from "@contentstack/cli-utilities";
import { AppCLIBaseCommand } from "../../app-cli-base-command";
import { $t, commonMsg, reinstallAppMsg } from "../../messages";
import {
  getOrg,
  getApp,
  getStack,
  reinstallApp,
  fetchApp,
  fetchStack,
} from "../../util";

export default class Reinstall extends AppCLIBaseCommand {
  static description: string | undefined =
    "Reinstall an app from the marketplace";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --stack-api-key <STACK-API-KEY-1>",
  ];

  static flags: FlagInput = {
    "app-uid": flags.string({
      description: commonMsg.APP_UID,
    }),
    "stack-api-key": flags.string({
      description: commonMsg.STACK_API_KEY,
    }),
  };

  async run(): Promise<void> {
    try {
      let app, stack, appType;
      this.flags["app-uid"] = this.manifestData?.uid ?? this.flags["app-uid"];

      if (this.flags["stack-api-key"]) {
        stack = await fetchStack(this.flags, {
          managementSdk: this.managementSdk,
          log: this.log,
        });
      }

      this.sharedConfig.org =
        this.manifestData?.organization_uid ??
        (await getOrg(this.flags, {
          managementSdk: this.managementSdk,
          log: this.log,
        }));

      if (!this.flags["app-uid"]) {
        app = await getApp(this.flags, this.sharedConfig.org, {
          marketplaceSdk: this.marketplaceAppSdk,
          log: this.log,
        });
      } else {
        app = await fetchApp(this.flags, this.sharedConfig.org, {
          marketplaceSdk: this.marketplaceAppSdk,
          log: this.log,
        });
      }
      appType = app?.["target_type"];
      this.flags["app-uid"] = app?.uid;

      if (appType === "organization" && this.flags["stack-api-key"]) {
        appType = "organization";
        const confirmation =
          this.flags["yes"] ||
          (await cliux.inquire({
            type: "confirm",
            message: $t(reinstallAppMsg.REINSTALL_ORG_APP_TO_STACK, {
              app: app?.name || app?.uid,
            }),
            name: "confirmation",
          }));
        if (!confirmation) {
          throw new Error(commonMsg.USER_TERMINATION);
        }
      }

      if (appType === "stack" && !this.flags["stack-api-key"]) {
        appType = "stack";

        this.log(
          $t(reinstallAppMsg.MISSING_STACK_API_KEY, {
            app: app?.name || app?.uid,
          }),
          "warn"
        );
        stack = await getStack(this.sharedConfig.org, {
          managementSdk: this.managementSdk,
          log: this.log,
        });
        this.flags["stack-api-key"] = stack?.["api_key"];
      }

      this.log(
        $t(reinstallAppMsg.REINSTALLING_APP_NOTICE, {
          app: app?.name || app?.uid,
          type: appType,
          target: this.flags["stack-api-key"] || this.sharedConfig.org,
        }),
        "info"
      );
      await reinstallApp({
        flags: this.flags,
        type: appType,
        developerHubBaseUrl: this.developerHubBaseUrl,
        orgUid: this.sharedConfig.org,
        manifestUid: this.flags["app-uid"],
      });
      this.log(
        $t(reinstallAppMsg.APP_REINSTALLED_SUCCESSFULLY, {
          app: app?.name || (this.flags["app-uid"] as string),
          target: stack?.name || this.sharedConfig.org,
        }),
        "info"
      );

      this.displayStackUrl();
    } catch (error: any) {
      this.log(error?.errorMessage || error?.message || error, "error");
      process.exit(1);
    }
  }

  displayStackUrl(): void {
    const stackPath = `${this.uiHost}/#!/stack/${this.flags["stack-api-key"]}/dashboard`;
    this.log(
      `Please use the following URL to start using the stack: ${stackPath}`,
      "info"
    );
  }
}
