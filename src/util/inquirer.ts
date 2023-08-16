import find from "lodash/find";
import { existsSync } from "fs";
import { basename, dirname, join } from "path";
import {
  cliux,
  FlagInput,
  configHandler,
  Stack,
  ContentstackClient
} from "@contentstack/cli-utilities";
import {Installation} from '@contentstack/management/types/app/installation'
import {AppTarget} from '@contentstack/management/types/app/index'

import config from "../config";
import messages, { $t, commonMsg, errors, uninstallAppMsg } from "../messages";
import { 
  CommonOptions, 
  getOrganizations, 
  fetchApps, 
  getStacks,
  fetchAppInstallations
} from "./common-utils";

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
          return messages.DIR_EXIST;
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
  cliux.loader("Loading Apps");
  const apps = (await fetchApps(flags, orgUid, options)) || [];
  cliux.loader("done");
  
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

async function getStack(orgUid: string, options: CommonOptions): Promise<Record<string, any> | undefined> {
  cliux.loader("Loading Stacks");
  const stacks = (await getStacks(options, orgUid)) || [];
  cliux.loader("done");
  
  if (stacks.length === 0) {
    // change this to stacks not found
    throw new Error(messages.APPS_NOT_FOUND)
  }
  
  const selectedStack = await cliux
    .inquire({
      type: "search-list",
      name: "Stack",
      choices: stacks,
      message: messages.CHOOSE_A_STACK
    })
    .then((name) => stacks.find(stack => stack.name === name))

  return selectedStack;
}

async function getInstallation(
  flags: FlagInput, 
  orgUid: string, 
  managementSdkForStacks: ContentstackClient,
  appType: AppTarget,
  options:CommonOptions
) : Promise<string> {
  const {log} = options;
  if (appType === 'stack') {
    cliux.loader("Loading App Installations");
  }
  let {items: installations} = (await fetchAppInstallations(flags, orgUid, options)) || [];

  // console.log(installations)
  if (!installations?.length) {
    if (appType === "stack") cliux.loader("done")
    throw new Error(messages.NO_INSTALLATIONS_FOUND)
  }

  let selectedInstallation: string;

  if (appType === 'stack') {
    // fetch stacks from where the app has to be uninstalled
    cliux.loader("done");
    const stacks: Stack[] = await getStacks({managementSdk: managementSdkForStacks, log: options.log}, orgUid);
    installations = populateMissingDataInInstallations(installations, stacks)
    selectedInstallation = await cliux
    .inquire({
      type: 'search-list',
      name: 'appInstallation',
      choices: installations,
      message: messages.CHOOSE_AN_INSTALLATION
    }) as string
  } else {
    // as this is an organization app, and it is supposed to only be installed on the source organization
    // it will be uninstalled from the selected organization
    selectedInstallation = installations.pop()?.uid || "";
  }

  log($t(uninstallAppMsg.UNINSTALLING_APP, {
    type: appType
  }), "info")

  return selectedInstallation;
}

function populateMissingDataInInstallations(installations: [Installation], stacks: Stack[]): [Installation] {
  let result = installations.map(installation => {
    let stack = stacks.filter(stack => stack.api_key === installation.target.uid)?.pop()
    installation.name = stack?.name || installation.target.uid;
    installation.value = installation.uid;
    return installation;
  }) as [Installation];

  if (result.length > 0) {
    return result
  }

  return installations

}

export { 
  getOrg, 
  getAppName, 
  getDirName, 
  getDeveloperHubUrl, 
  getApp,
  getStack,
  getInstallation
};
