import find from "lodash/find";
import { existsSync } from "fs";
import { basename, dirname, join } from "path";
import { FlagInput, cliux } from "@contentstack/cli-utilities";

import messages, { $t, errors } from "../messages";
import { CommonOptions, getOrganizations } from "./common-utils";

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

export { getOrg, getAppName, getDirName };
