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
  const organizations = (await getOrganizations(options)) || [];

  if (!(flags.org && find(organizations, { uid: flags.org }))) {
    if (flags.org) {
      throw new Error(messages.ORG_UID_NOT_FOUND)
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
async function getApp(flags: FlagInput, orgUid: string, options: CommonOptions) : Promise<Record<string, any> | undefined> {
  cliux.loader("Loading Apps");
  const apps = (await getApps(flags, orgUid, options)) || [];
  cliux.loader("");
  if (apps.length === 0) {
    throw new Error(messages.APPS_NOT_FOUND)
  }
  if (!(flags.app && apps.find(app => app.uid === flags.app))) {
    if (flags.app) {
      throw new Error(messages.APP_UID_NOT_FOUND)
    }

    flags.app = await cliux
      .inquire({
        type: "search-list",
        name: "App",
        choices: apps,
        message: messages.CHOOSE_APP
      })
      .then((name) => apps.find(app => app.name === name)?.uid)
  }

  return apps.find(app => app.uid === flags.app);
}

export { getOrg, getAppName, getApp };
