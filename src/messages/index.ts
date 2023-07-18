const errors = {
  NOT_EMPTY: "{value} can't be empty",
  INVALID_APP_ID: "App UID must be valid",
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
    "Provided App UID not matching with app manifest.json app UID",
  APP_CREATION_CONSTRAINT_FAILURE:
    "App could not be registered. Please go through the constraints on app name and try running the command again.",
  APP_INVALID_ORG:
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
  APP_UID: "Provide the app UID",
  APP_TYPE_DESCRIPTION: "Type of App",
  CONTACT_SUPPORT: "Please contact support team.",
  STACK_API_KEY: "Please provide api-key for the stack"
};

const appCreate = {
  ORG_UID: "Org UID",
  NAME: "{target} name",
  UNZIP: "Unzipping the boilerplate",
  APP_TYPE_DESCRIPTION: "Type of App",
  CHOOSE_ORG: "Choose an organization",
  DIR_EXIST: "Directory name already exist",
  ROLLBACK_BOILERPLATE: "Roll back boilerplate",
  APP_UPDATE_FAILED: "Update app process failed",
  INSTALL_DEPENDENCIES: "Installing dependencies",
  NAME_DESCRIPTION: "Name of the app to be created",
  APP_CREATION_SUCCESS: "App creation successful!",
  CLONE_BOILERPLATE: "Fetching the app template from GitHub",
  CONFIRM_CLONE_BOILERPLATE:
    "Would you like to fetching the app template from GitHub",
  REGISTER_THE_APP_ON_DEVELOPER_HUB:
    "Registering the app with name {appName} on Developer Hub",
  START_APP_COMMAND: "Start the app using following command: {command}",
};

const getApp = {
  CHOOSE_APP: "Choose an App",
  APP_UID_NOT_FOUND: "App UID not found",
  FILE_WRITTEN_SUCCESS: "App data has been written to {file} successfully.",
  APPS_NOT_FOUND: "No apps found",
  FILE_ALREADY_EXISTS: "{file} already exists, would you like to save app to a new file? (Selecting No will over-write {file}) (y/n)"
}

const appUpdate = {
  APP_UID: "Provide the app UID",
  FILE_PATH: "Path to the {fileName} file",
  APP_UPDATE_SUCCESS: "App update successful!",
  APP_VERSION_MISS_MATCH:
    "App versions are not matching. Please download the latest file using the `csdx app:get` command and sync their file with this file",
};

const deleteAppMsg = {
  APP_IS_INSTALLED: "This app is installed in one of your stacks. Please uninstall to proceed with delete.",
  APP_DELETED_SUCCESSFULLY: "{app} has been deleted successfully.",
  APP_UID_INVALID: "app uid must be valid",
  PLEASE_SELECT_APP_FROM_LIST: "Please select an app from the list",
}

const installAppMsg = {
  CHOOSE_A_STACK: "Please select a stack",
  APP_INSTALLED_SUCCESSFULLY: "{app} has been installed successfully on {target}.",
  INSTALL_ORG_APP_TO_STACK: "{app} is an organization app, it cannot be installed to a stack. Do you want to proceed",
  MISSING_STACK_API_KEY: "As {app} is a stack app, it can only be installed on a stack. Please select a stack.",
  INSTALLING_APP_NOTICE: "Installing {app} on {type} {target}"
}

const messages: typeof errors &
  typeof commonMsg &
  typeof appCreate &
  typeof appUpdate &
  typeof getApp &
  typeof deleteAppMsg &
  typeof installAppMsg = {
  ...errors,
  ...commonMsg,
  ...appCreate,
  ...appUpdate,
  ...getApp,
  ...deleteAppMsg,
  ...installAppMsg
};

const $t = (msg: string, args: Record<string, string>): string => {
  if (!msg) return "";

  for (const key of Object.keys(args)) {
    msg = msg.replace(new RegExp(`{${key}}`, 'g'), args[key]);
  }

  return msg;
};

export default messages;
export { $t, errors, commonMsg, appCreate, appUpdate, getApp, deleteAppMsg, installAppMsg };
