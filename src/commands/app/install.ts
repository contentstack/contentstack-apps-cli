import { BaseCommand } from "./base-command";
import { Command, flags } from "@contentstack/cli-utilities";
import { commonMsg } from "../../messages";
import { getOrg, getApp, getStack, installApp} from "../../util";

export default class Install extends BaseCommand<typeof Install> {
    static description: string | undefined = "Install an app from the marketplace";

    static examples: Command.Example[] = [
        "$ <%= config.bin %> <%= command.id =%>"
    ]

    static flags = {
      'app-uid': flags.string({
        description: commonMsg.APP_UID,
      }),
      'stack-api-key': flags.string({
        description: commonMsg.STACK_API_KEY
      }),
      'target-org-uid': flags.string({
        description: commonMsg.APP_UID
      })
    }

    async run(): Promise<void> {
      try {
        let app, stack, appType;
        this.sharedConfig.org = await getOrg(this.flags, {managementSdk: this.managementSdk, log: this.log});
        if (!this.flags['app-uid']) {
          app = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log})
          appType = app?.['target_type'] // pick type from the fetched app
          this.flags['app-uid'] = app?.uid;
        }
        if (appType === 'stack' && !this.flags['stack-api-key']) {
          stack = await getStack(this.sharedConfig.org, {managementSdk: this.managementSdk, log: this.log})
          this.flags['stack-api-key'] = stack?.['api_key']
        }
        // if (appType === 'organization' && !this.flags['target-org-uid']) {
        //   const confirmation = await cliux.inquire({
        //     type: "confirm",
        //     message: installAppMsg.INSTALL_IN_EXISTING_ORG,
        //     name: "confirmation"
        //   })
        //   if (confirmation) {
        //     this.flags['target-org-uid'] = this.sharedConfig.org
        //   } else {
        //     const targetOrg = await getApp(this.flags, this.sharedConfig.org, {managementSdk: this.managementAppSdk, log: this.log});
        //     this.flags['target-org-uid'] = targetOrg?.uid;
        //   }
        // }
        let response = await installApp(this.flags, this.sharedConfig.org, appType, {managementSdk: this.managementAppSdk, log: this.log})
        console.log(response);
        // stack or org where it needs to be installed
        // a prompt maybe to ask if the app is to be installed at stack level or org level
        // a method to fetch and display stacks if stack-api-key is not provided and if the app is to be installed at stack level
        // 
      } catch(error: any) {
        this.log(error?.errorMessage, "error")
      }
    }
}