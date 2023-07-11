import find from "lodash/find";
import { existsSync } from "fs";
import { basename, dirname, join } from "path";
import {
  cliux,
  FlagInput,
  configHandler,
} from "@contentstack/cli-utilities";

import config from "../config";
import messages, { $t, commonMsg, errors } from "../messages";
import { CommonOptions, getOrganizations, fetchApps, fetchApp } from "./common-utils";

/**
 * @method getAppName
 *
 * @return {*}  {(Promise<string | boolean>)}
 */
async function getAppName(defaultName: string = ""): Promise<string | boolean> {
  return cliux.inquire({
    type: "input",
    name: "appName",
    default: defaultName,
    message: $t(messages.NAME, { target: "App" }),
    validate: (name) => {
      if (name.length < 3 || name.length > 20) {
        return $t(errors.INVALID_NAME, { min: "3", max: "20" });
      }

      return true;
    },
  });
}

/**
 * @method getDirName
 *
 * @param {string} [defaultName=""]
 * @return {*}  {(Promise<string | boolean>)}
 */
async function getDirName(path: string): Promise<string> {
  const basePath = dirname(path);
  const defaultName = basename(path);

  return cliux
    .inquire({
      type: "input",
      name: "dirName",
      default: defaultName,
      message: $t(messages.NAME, { target: "Directory" }),
      validate: (name) => {
        if (name.length < 3 || name.length > 30) {
          return $t(errors.INVALID_NAME, { min: "3", max: "50" });
        }

        if (existsSync(join(basePath, name))) {
          return $t(errors.INVALID_NAME, { min: "3", max: "50" });
        }

        return true;
      },
    })
    .then((name) => join(basePath, name as string));
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

async function getApp(flags: FlagInput, orgUid: string, options: CommonOptions) : Promise<Record<string, any> | undefined> {
  if (flags['app-uid']) {
    try {
      const app = await fetchApp(flags, orgUid, options)
      return app;
    } catch (error) {
      throw new Error(messages.APP_UID_NOT_FOUND)
    }
  } else {
    cliux.loader("Loading Apps");
    const apps = (await fetchApps(flags, orgUid, options)) || [];
    
    if (apps.length === 0) {
      throw new Error(messages.APPS_NOT_FOUND)
    }
    
    flags.app = await cliux
      .inquire({
        type: "search-list",
        name: "App",
        choices: apps,
        message: messages.CHOOSE_APP
      })
      .then((name) => apps.find(app => app.name === name)?.uid)

    return apps.find(app => app.uid === flags.app);
  }
}

/**
 * @method getDeveloperHubUrl
 *
 * @return {*}  {Promise<string>}
 */
async function getDeveloperHubUrl(): Promise<string> {
  const { cma, name } = configHandler.get("region") || {};
  let developerHubBaseUrl = (config.developerHubUrls as Record<string, string>)[
    cma
  ];

  if (!developerHubBaseUrl) {
    developerHubBaseUrl = await cliux.inquire({
      type: "input",
      name: "name",
      validate: (url) => {
        if (!url) return errors.BASE_URL_EMPTY;

        return true;
      },
      message: $t(commonMsg.DEVELOPER_HUB_URL_PROMPT, { name }),
    });
  }

  if (developerHubBaseUrl.startsWith("http")) {
    developerHubBaseUrl = developerHubBaseUrl.split("//")[1];
  }

  return developerHubBaseUrl;
}

export { getOrg, getAppName, getDirName, getDeveloperHubUrl, getApp };
