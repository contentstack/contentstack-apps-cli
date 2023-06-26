import find from "lodash/find";
import { FlagInput, cliux } from "@contentstack/cli-utilities";

import messages, { errors } from "../messages";
import { CommonOptions, getOrganizations } from "./common-utils";

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

export { getOrg, getAppName };
