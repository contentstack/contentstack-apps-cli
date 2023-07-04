const errors = {
  ORG_UID_NOT_FOUND: "Organization UID not found!",
  INVALID_ORG_UID: "Please enter a valid organization uid.",
  INVALID_APP_NAME:
    "Please enter a valid name that is 3 to 20 characters long.",
  FILE_GENERATION_FAILURE:
    "Could not generate the file. Please try running the command again.",
  APP_CREATION_FAILURE:
    "App could not be registered on Developer Hub. Please check your internet connectivity and try running the command again.",
  APP_CREATION_CONSTRAINT_FAILURE:
    "App could not be registered. Please go through the constraints on app name and try running the command again.",
  APP_CREATION_INVALID_ORG:
    "App could not be registered. Please verify the inputs and try again.",
  DUPLICATE_APP_NAME:
    "The {appName} app already exists. Please create an app with a different name.",
};

const commonMsg = {
  SKIP_CONFIRMATION: "Use this flag to skip confirmation",
};

const appCreate = {
  ORG_UID: "Org UID",
  APP_NAME: "App Name",
  DEFAULT_APP_NAME: "app-boilerplate",
  APP_TYPE_DESCRIPTION: "Type of App",
  CHOOSE_ORG: "Choose an organization",
  PROVIDE_ORG_UID: "Provide the organization UID",
  INSTALL_DEPENDENCIES: "Installing dependencies",
  NAME_DESCRIPTION: "Name of the app to be created",
  APP_CREATION_SUCCESS: "App creation successful!!",
  CLONE_BOILERPLATE: "Fetching the app template from GitHub",
  CONFIRM_CLONE_BOILERPLATE:
    "Would you like to fetching the app template from GitHub",
  REGISTER_THE_APP_ON_DEVELOPER_HUB:
    "Registering the app with name {appName} on Developer Hub",
};

const messages: typeof errors & typeof appCreate = {
  ...errors,
  ...commonMsg,
  ...appCreate,
};

const $t = (msg: string, args: Record<string, string>): string => {
  if (!msg) return "";

  for (const key of Object.keys(args)) {
    msg = msg.replace(new RegExp(`{${key}}`), args[key]);
  }

  return msg;
};

export default messages;
export { $t, errors, commonMsg, appCreate };
