const errors = {
  NOT_EMPTY: "{value} can't be empty",
  ORG_UID_NOT_FOUND: "Organization UID not found!",
  BASE_URL_EMPTY: "Developer-hub URL can't be empty.",
  INVALID_ORG_UID: "Please enter a valid organization uid.",
  PATH_NOT_FOUND: "Provide path '{path}' is not valid/found.",
  INVALID_NAME:
    "Please enter a valid name that is {min} to {max} characters long.",
  FILE_GENERATION_FAILURE:
    "Could not generate the file. Please try running the command again.",
  APP_CREATION_FAILURE: "App could not be registered on Developer Hub",
  APP_UID_NOT_MATCH:
    "Provided App UID not matching with app-manifest.json app UID",
  APP_CREATION_CONSTRAINT_FAILURE:
    "App could not be registered. Please go through the constraints on app name and try running the command again.",
  APP_CREATION_INVALID_ORG:
    "App could not be registered. Please verify the inputs and try again.",
  DUPLICATE_APP_NAME:
    "The {appName} app already exists. Please create an app with a different name.",
};

const commonMsg = {
  CONFIG: "Path of the external config",
  MAX_RETRY_LIMIT: "Maximum retry limit reached.",
  PROVIDE_ORG_UID: "Provide the organization UID",
  CURRENT_WORKING_DIR: "Current working directory",
  SKIP_CONFIRMATION: "Use this flag to skip confirmation",
  DEVELOPER_HUB_URL_PROMPT:
    "Enter the developer-hub base URL for the {name} region - ",
};

const appCreate = {
  ORG_UID: "Org UID",
  NAME: "{target} name",
  DIR_EXIST: "Directory name already exist",
  UNZIP: "Unzipping the boilerplate",
  DEFAULT_APP_NAME: "app-boilerplate",
  APP_TYPE_DESCRIPTION: "Type of App",
  CHOOSE_ORG: "Choose an organization",
  ROLLBACK_BOILERPLATE: "Roll back boilerplate",
  INSTALL_DEPENDENCIES: "Installing dependencies",
  NAME_DESCRIPTION: "Name of the app to be created",
  APP_CREATION_SUCCESS: "App creation successful!!",
  CLONE_BOILERPLATE: "Fetching the app template from GitHub",
  CONFIRM_CLONE_BOILERPLATE:
    "Would you like to fetching the app template from GitHub",
  REGISTER_THE_APP_ON_DEVELOPER_HUB:
    "Registering the app with name {appName} on Developer Hub",
  START_APP_COMMAND: "Start the app using following command: {command}",
};

const appUpdate = {
  APP_UID: "Provide the app UID",
  FILE_PATH: "Path to the {fileName} file",
};

const messages: typeof errors &
  typeof commonMsg &
  typeof appCreate &
  typeof appUpdate = {
  ...errors,
  ...commonMsg,
  ...appCreate,
  ...appUpdate,
};

const $t = (msg: string, args: Record<string, string>): string => {
  if (!msg) return "";

  for (const key of Object.keys(args)) {
    msg = msg.replace(new RegExp(`{${key}}`), args[key]);
  }

  return msg;
};

export default messages;
export { $t, errors, commonMsg, appCreate, appUpdate };
