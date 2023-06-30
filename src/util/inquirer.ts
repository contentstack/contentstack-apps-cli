import find from "lodash/find";
import { FlagInput, cliux } from "@contentstack/cli-utilities";

import messages, { errors } from "../messages";
import { CommonOptions, getOrganizations, getApps } from "./common-utils";

/**
 * @method getAppName
 *
 * @return {*}  {(Promise<string | boolean>)}
 */
async function getAppName(): Promise<string | boolean> {
  return cliux.inquire({
    type: "input",
    name: "appName",
    message: messages.APP_NAME,
    validate: (name) => {
      if (name.length < 3 || name.length > 20) {
        return errors.INVALID_APP_NAME;
      }

      return true;
    },
  });
}

/**
 * @method getOrg
 *
 * @param {FlagInput} flags
 * @param {CommonOptions} options
 * @return {*}
 */
async function getOrg(flags: FlagInput, options: CommonOptions) {
  const { log } = options;
  const organizations = (await getOrganizations(options)) || [];

  if (!(flags.org && find(organizations, { uid: flags.org }))) {
    if (flags.org) {
      log(messages.ORG_UID_NOT_FOUND, "error");
    }

    flags.org = await cliux
      .inquire({
        type: "search-list",
        name: "Organization",
        choices: organizations,
        message: messages.CHOOSE_ORG,
      })
      .then((name) => find(organizations, { name })?.uid);
  }

  return flags.org;
}

/**
 * @method 
 */
async function getApp(flags: FlagInput, orgUid: string, options: CommonOptions) {
  const { log } = options;
  const apps = (await getApps(orgUid, options)) || [];
  if (!(flags['app-uid'] && apps.find(app => app.uid === flags['app-uid']))) {
    if (flags['app-uid']) {
      // app-uid not found?
    }

    // flags['app-uid'] = await cliux
    //   .inquire({
    //     type: "search-list",
    //     name: "App",
    //     choices: apps,
    //     message: messages.CHOOSE_APP
    //   })
  }
  console.log(apps)
}

export { getOrg, getAppName, getApp };
