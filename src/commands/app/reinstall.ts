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




// import {
//   getOrg,
//   getApp,
//   getStack,
//   reinstallApp,
//   fetchApp,
//   fetchStack,
// } from "../../util";

// export default class Reinstall extends AppCLIBaseCommand {
//   static description: string | undefined = "Reinstall an app from the marketplace";

//   static examples = [
//     "$ <%= config.bin %> <%= command.id %>",
//     "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
//     "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --stack-api-key <STACK-API-KEY-1>",
//   ];

//   static flags = {
//     "app-uid": flags.string({
//       description: reinstallAppMsg.APP_UID,
//     }),
//     "stack-api-key": flags.string({
//       description: commonMsg.STACK_API_KEY,
//     }),
//   };

//   private authToken: string;

//   constructor(argv: any, config: any) {
//     super(argv, config);
//     this.authToken = this.getAuthToken();
//   }

//   private getAuthToken(): string {
//     return process.env.AUTH_TOKEN || '';
//   }

//     async run(): Promise<void> {
//     try {
//       let app, stack, appType;
//       this.flags["app-uid"] = this.manifestData?.uid ?? this.flags["app-uid"]; // manifest file first preference

//       // Validating user-given stack, as reinstallation API doesn't return appropriate errors if stack-api-key is invalid
//       // Validate this first, as orgUid is not required for fetching stack
//       if (this.flags["stack-api-key"]) {
//         stack = await fetchStack(this.flags, {
//           managementSdk: this.managementSdk,
//           log: this.log,
//         });
//       }

//       // Get organization to be used
//       this.sharedConfig.org =
//         this.manifestData?.organization_uid ??
//         (await getOrg(this.flags, {
//           managementSdk: this.managementSdk,
//           log: this.log,
//         }));

//       // Fetch app details
//       if (!this.flags["app-uid"]) {
//         app = await getApp(this.flags, this.sharedConfig.org, {
//           managementSdk: this.managementAppSdk,
//           log: this.log,
//         });
//       } else {
//         app = await fetchApp(this.flags, this.sharedConfig.org, {
//           managementSdk: this.managementAppSdk,
//           log: this.log,
//         });
//       }
//       appType = app?.["target_type"]; // Get app-type from the fetched app
//       this.flags["app-uid"] = app?.uid;

//       // Construct the reinstall URL
//       const manifestUid = this.flags["app-uid"];
//       const reinstallUrl = `/manifests/${manifestUid}/reinstall`;

//       // In case stack-api-key is provided and the selected app is an organization app
//       if (appType === "organization" && this.flags["stack-api-key"]) {
//         const confirmation =
//           this.flags["yes"] ||
//           (await cliux.inquire({
//             type: "confirm",
//             message: $t(reinstallAppMsg.REINSTALL_ORG_APP_TO_STACK, {
//               app: app?.name || app?.uid,
//             }),
//             name: "confirmation",
//           }));
//         if (!confirmation) {
//           throw new Error(commonMsg.USER_TERMINATION);
//         }
//       }

//       // In case a stack app is selected and no stack-api-key is provided
//       if (appType === "stack" && !this.flags["stack-api-key"]) {
//         this.log(
//           $t(reinstallAppMsg.MISSING_STACK_API_KEY, {
//             app: app?.name || app?.uid,
//           }),
//           "warn"
//         );
//         stack = await getStack(this.sharedConfig.org, {
//           managementSdk: this.managementSdk,
//           log: this.log,
//         });
//         this.flags["stack-api-key"] = stack?.["api_key"];
//       }

//       // Prepare options for reinstallApp function
//       const options = {
//         headers: {
//           Authorization: `Bearer ${this.authToken}`,
//         },
//         timeout: 30000, // 30 seconds timeout
//       };

//       // Reinstall app
//       this.log(
//         $t(reinstallAppMsg.REINSTALLING_APP_NOTICE, {
//           app: app?.name || app?.uid,
//           type: appType,
//           target: this.flags["stack-api-key"] || this.sharedConfig.org,
//         }),
//         "info"
//       );
//       await reinstallApp(reinstallUrl, this.flags, this.sharedConfig.org, appType, options);
//       this.log(
//         $t(reinstallAppMsg.APP_REINSTALLED_SUCCESSFULLY, {
//           app: app?.name || (this.flags["app-uid"] as string),
//           target: stack?.name || this.sharedConfig.org,
//         }),
//         "info"
//       );

//       this.displayStackUrl();
//     } catch (error: any) {
//       this.log(error?.errorMessage || error?.message || error, "error");
//       this.exit(1);
//     }
//   }

//   displayStackUrl(): void {
//     const stackPath = `${this.uiHost}/#!/stack/${this.flags["stack-api-key"]}/dashboard`;
//     this.log(`Please use the following URL to start using the stack: ${stackPath}`, "info");
//   }
// }


// import axios from 'axios'; // Assuming you have Axios installed

// export default class Reinstall extends AppCLIBaseCommand {
//   // Other static properties and methods

//   async run(): Promise<void> {
//     try {
//       // Other code to fetch app details and construct the URL

//       const manifestUid = this.flags["app-uid"];
//       const reinstallUrl = `/manifests/${manifestUid}/reinstall`;

//       // Prepare request payload and headers
//       const payload = {
//         // If you need to send any data in the request body, add it here
//       };

//       const headers = {
//         // If you need to include any headers, such as authorization token, add them here
//         Authorization: `Bearer ${this.getAuthToken()}`,
//       };

//       // Make the PUT request to reinstall the app
//       const response = await axios.put(reinstallUrl, payload, { headers });

//       // Handle the response
//       if (response.status === 200) {
//         this.log(
//           $t(reinstallAppMsg.APP_REINSTALLED_SUCCESSFULLY, {
//             app: app?.name || (this.flags["app-uid"] as string),
//             target: stack?.name || this.sharedConfig.org,
//           }),
//           "info"
//         );

//         this.displayStackUrl();
//       } else {
//         throw new Error("Failed to reinstall the app."); // Handle the error according to your application logic
//       }
//     } catch (error: any) {
//       this.log(error?.response?.data || error?.message || error, "error");
//       this.exit(1);
//     }
//   }
// }
