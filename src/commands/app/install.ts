import { BaseCommand } from "./base-command";
import { cliux, flags } from "@contentstack/cli-utilities";
import { $t, commonMsg, installAppMsg } from "../../messages";
import { getOrg, getApp, getStack, installApp, fetchApp, fetchStack} from "../../util";

export default class Install extends BaseCommand<typeof Install> {
    static description: string | undefined = "Install an app from the marketplace";

    static examples = [
      "$ <%= config.bin %> <%= command.id %>",
    ];

    static flags = {
      'app-uid': flags.string({
        description: commonMsg.APP_UID,
      }),
      'stack-api-key': flags.string({
        description: commonMsg.STACK_API_KEY
      })
    }

    async run(): Promise<void> {
      try {
        let app, stack, appType;
        
        // validating user given stack, as installation API doesn't return appropriate errors if stack-api-key is invalid
        // validating this first, as orgUid is not required for fetching stack
        if (this.flags['stack-api-key']) {
          stack = await fetchStack(this.flags, {managementSdk: this.managementSdk, log: this.log})
        }

        // get organization to be used
        this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
        
        // fetch app details
        if (!this.flags['app-uid']) {
          app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        } else {
          app = await fetchApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
        }
        appType = app?.['target_type'] // get app-type from the fetched app
        this.flags['app-uid'] = app?.uid;

        // in case stack-api-key is provided and the selected app is an organization app
        if (appType === 'organization' && this.flags['stack-api-key']) {
          const confirmation = this.flags['yes'] || await cliux.inquire({
            type: "confirm",
            message: $t(installAppMsg.INSTALL_ORG_APP_TO_STACK, { app: app?.name || app?.uid }),
            name: "confirmation"
          })
          if (!confirmation) {
            throw new Error(commonMsg.USER_TERMINATION)
          }
        }

        // in case a stack app is selected and no stack-api-key is provided
        if (appType === 'stack' && !this.flags['stack-api-key']) {
          this.log($t(installAppMsg.MISSING_STACK_API_KEY, { app: app?.name || app?.uid }), "warn")
          stack = await getStack(this.sharedConfig.org, {managementSdk: this.managementSdk, log: this.log})
          this.flags['stack-api-key'] = stack?.['api_key']
        }

        // install app
        this.log($t(installAppMsg.INSTALLING_APP_NOTICE, {
          app: app?.name || app?.uid,
          type: appType,
          target: this.flags['stack-api-key'] || this.sharedConfig.org
        }), "warn")
        await installApp(this.flags, this.sharedConfig.org, appType, {managementSdk: this.managementAppSdk, log: this.log})
        this.log($t(installAppMsg.APP_INSTALLED_SUCCESSFULLY, {
          app: app?.name || this.flags['app-uid'] as string,
          target: stack?.name || this.sharedConfig.org
        }), "info");
      } catch(error: any) {
        this.log(error?.errorMessage || error?.message || error, "error")
        this.exit()
      }
    }
}