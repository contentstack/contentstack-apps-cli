import { cliux, flags } from "@contentstack/cli-utilities";
import { AppCLIBaseCommand } from "../../app-cli-base-coomand";
import { $t, commonMsg, reinstallAppMsg } from "../../messages";
import {
  getOrg,
  getApp,
  getStack,
  reinstallApp as reinstallAppUtil,
  fetchApp,
  fetchStack,
} from '../../util';

export default class Reinstall extends AppCLIBaseCommand {
  static description = 'Reinstall an app from the marketplace';

  static examples = [
    '$ <%= config.bin %> <%= command.id %>',
    '$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>',
    '$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --stack-api-key <STACK-API-KEY-1>',
  ];

  static flags = {
    'app-uid': flags.string({
      description: reinstallAppMsg.APP_UID,
    }),
    'stack-api-key': flags.string({
      description: commonMsg.STACK_API_KEY,
    }),
  };

  private authToken: string;

  constructor(argv: any, config: any) {
    super(argv, config);
    this.authToken = this.getAuthToken();
  }

  private getAuthToken(): string {
    return process.env.AUTH_TOKEN || 'AUTHTOKEN';
  }

  async run(): Promise<void> {
    try {
      let app, stack, appType;
      this.flags['app-uid'] = this.manifestData?.uid ?? this.flags['app-uid'];

      if (this.flags['stack-api-key']) {
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

      if (!this.flags['app-uid']) {
        app = await getApp(this.flags, this.sharedConfig.org, {
          managementSdk: this.managementAppSdk,
          log: this.log,
        });
      } else {
        app = await fetchApp(this.flags, this.sharedConfig.org, {
          managementSdk: this.managementAppSdk,
          log: this.log,
        });
      }
      appType = app?.['target_type'];
      this.flags['app-uid'] = app?.uid;

      if (appType === 'organization' && this.flags['stack-api-key']) {
        const confirmation =
          this.flags['yes'] ||
          (await cliux.inquire({
            type: 'confirm',
            message: $t(reinstallAppMsg.REINSTALL_ORG_APP_TO_STACK, {
              app: app?.name || app?.uid,
            }),
            name: 'confirmation',
          }));
        if (!confirmation) {
          throw new Error(commonMsg.USER_TERMINATION);
        }
      }

      if (appType === 'stack' && !this.flags['stack-api-key']) {
        this.log(
          $t(reinstallAppMsg.MISSING_STACK_API_KEY, {
            app: app?.name || app?.uid,
          }),
          'warn'
        );
        stack = await getStack(this.sharedConfig.org, {
          managementSdk: this.managementSdk,
          log: this.log,
        });
        this.flags['stack-api-key'] = stack?.['api_key'];
      }

      this.log(
        $t(reinstallAppMsg.REINSTALLING_APP_NOTICE, {
          app: app?.name || app?.uid,
          type: appType,
          target: this.flags['stack-api-key'] || this.sharedConfig.org,
        }),
        'info'
      );

      await reinstallAppUtil(
        this.flags['app-uid'],
        this.authToken,
        this.sharedConfig.org,
        appType,
        this.flags['stack-api-key'] || this.sharedConfig.org
      );

      this.log(
        $t(reinstallAppMsg.APP_REINSTALLED_SUCCESSFULLY, {
          app: app?.name || (this.flags['app-uid'] as string),
          target: stack?.name || this.sharedConfig.org,
        }),
        'info'
      );

      this.displayStackUrl();
    } catch (error: any) {
      this.log(error?.errorMessage || error?.message || error, 'error');
      this.exit(1);
    }
  }

  displayStackUrl(): void {
    const stackPath = `${this.uiHost}/#!/stack/${this.flags['stack-api-key']}/dashboard`;
    this.log(`Please use the following URL to start using the stack: ${stackPath}`, 'info');
  }
}
