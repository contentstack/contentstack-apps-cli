const errors = {
  NOT_EMPTY: "{value} cannot be empty.",
  INVALID_APP_ID: "Please enter a valid app UID.",
  ORG_UID_NOT_FOUND:
    "Organization UID not found. Please enter a valid organization UID.",
  BASE_URL_EMPTY: "Developer Hub URL cannot be empty.",
  INVALID_ORG_UID: "Please enter a valid organization UID.",
  PATH_NOT_FOUND:
    "Failed to locate the provided path '{path}'. Please enter a valid path.",
  INVALID_NAME:
    "Please enter a valid name that is {min} to {max} characters long.",
  FILE_GENERATION_FAILURE:
    "Failed to generate the file! Please try running the command again.",
  APP_CREATION_FAILURE: "App could not be registered on Developer Hub.",
  APP_UID_NOT_MATCH:
    "Provided app UID is not matching with the app manifest.json app UID",
  APP_CREATION_CONSTRAINT_FAILURE:
    "App could not be registered. Please go through the constraints on the app name and try running the command again.",
  APP_INVALID_ORG:
    "App could not be registered. Please verify the inputs and try again.",
  DUPLICATE_APP_NAME:
    "The {appName} app already exists. Please create an app with a different name.",
};

const commonMsg = {
  CONFIG: "Path of the external config",
  MAX_RETRY_LIMIT: "Maximum retry limit reached.",
  PROVIDE_ORG_UID: "Provide the organization UID",
  CURRENT_WORKING_DIR: "Current working directory.",
  SKIP_CONFIRMATION: "Use this flag to skip the confirmation.",
  DEVELOPER_HUB_URL_PROMPT:
    "Enter the Developer Hub Base URL for the {name} region: ",
  APP_UID: "Provide the app UID",
  APP_TYPE_DESCRIPTION: "Type of App",
};

const appCreate = {
  ORG_UID: "Organization UID",
  NAME: "{target} name",
  UNZIP: "Unzipping the boilerplate...",
  APP_TYPE_DESCRIPTION: "Type of App",
  CHOOSE_ORG: "Choose an organization",
  DIR_EXIST: "Directory name already exists.",
  ROLLBACK_BOILERPLATE: "Rolling back boilerplate...",
  APP_UPDATE_FAILED: "App update process failed!",
  INSTALL_DEPENDENCIES: "Installing dependencies...",
  NAME_DESCRIPTION: "Name of the app to be created",
  APP_CREATION_SUCCESS: "App created successfully!",
  CLONE_BOILERPLATE: "Fetching the app template from GitHub...",
  CONFIRM_CLONE_BOILERPLATE:
    "Would you like to fetch the app template from GitHub?",
  REGISTER_THE_APP_ON_DEVELOPER_HUB:
    "Registering the app with the name {appName} on the Developer Hub...",
  START_APP_COMMAND: "Start the app using the following command: {command}",
};

const getApp = {
  CHOOSE_APP: "Choose an app",
  APP_UID_NOT_FOUND: "App UID was not found!",
  FILE_WRITTEN_SUCCESS: "App data has been written to {file} successfully.",
  APPS_NOT_FOUND: "No apps found!",
  FILE_ALREADY_EXISTS:
    "{file} already exists. Would you like to save the app to a new file? (Selecting No will over-write {file}) (y/n)",
};

const appUpdate = {
  APP_UID: "Provide the app UID",
  FILE_PATH: "Path to the {fileName} file:",
  APP_UPDATE_SUCCESS: "App updated successfully!",
  APP_VERSION_MISS_MATCH:
    "App versions mismatch! Please download the latest file using the `csdx app:get` command and sync the file with the latest downloaded file.",
};

const messages: typeof errors &
  typeof commonMsg &
  typeof appCreate &
  typeof appUpdate &
  typeof getApp = {
  ...errors,
  ...commonMsg,
  ...appCreate,
  ...appUpdate,
  ...getApp
};

const $t = (msg: string, args: Record<string, string>): string => {
  if (!msg) return "";

  for (const key of Object.keys(args)) {
    msg = msg.replace(new RegExp(`{${key}}`, 'g'), args[key]);
  }

  return msg;
};

export default messages;
export { $t, errors, commonMsg, appCreate, appUpdate, getApp };
