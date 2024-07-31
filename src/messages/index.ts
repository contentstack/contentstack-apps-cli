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
  INVALID_URL:
    "Please enter a valid URL. The URL should start with http:// or https://",
};

const commonMsg = {
  CONFIG: "Path of the external config",
  MAX_RETRY_LIMIT: "Maximum retry limit reached.",
  PROVIDE_ORG_UID: "Provide the organization UID to fetch the app details for the operation.",
  CURRENT_WORKING_DIR: "Current working directory.",
  SKIP_CONFIRMATION: "Use this flag to skip the confirmation.",
  DEVELOPER_HUB_URL_PROMPT:
    "Enter the Developer Hub Base URL for the {name} region: ",
  APP_UID: "Provide the app UID of an existing app.",
  APP_TYPE_DESCRIPTION: "Type of app",
  CONTACT_SUPPORT: "Please contact the support team.",
  STACK_API_KEY: "API key of the stack where the app operation is to be performed.",
  USER_TERMINATION: "Process terminated by the user.",
  CLI_APP_CLI_LOGIN_FAILED: 'You are not logged in. Please login with command $ csdx auth:login' 
};

const appCreate = {
  ORG_UID: "Organization UID",
  NAME: "{target} name",
  UNZIP: "Unzipping the boilerplate...",
  APP_TYPE_DESCRIPTION: "Type of app",
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
  BOILERPLATE_TEMPLATES: "Provide a boilerplate. <options: App Boilerplate|DAM App Boilerplate|Ecommerce App Boilerplate>",
  SELECT_BOILERPLATE: "Select one from the following boilerplates:"
};

const getAppMsg = {
  CHOOSE_APP: "Choose an app",
  APP_UID_NOT_FOUND: "App UID was not found!",
  FILE_WRITTEN_SUCCESS: "App data has been written to {file} successfully.",
  APPS_NOT_FOUND: "No apps found!",
  FILE_ALREADY_EXISTS:
    "{file} already exists. Do you want to overwrite this file? (y/n) (Selecting 'n' creates a new file)",
};

const appUpdate = {
  APP_UID: "Provide the app UID",
  FILE_PATH: "Path to the {fileName} file:",
  APP_UPDATE_SUCCESS: "App updated successfully!",
  APP_VERSION_MISS_MATCH:
    "App versions mismatch! Please download the latest file using the `csdx app:get` command and sync the file with the latest downloaded file.",
};

const deleteAppMsg = {
  APP_IS_INSTALLED: "This app is installed in one of your stacks. Please uninstall the app from your stack to proceed with the delete operation.",
  APP_DELETED_SUCCESSFULLY: "{app} deleted successfully.",
  APP_UID_INVALID: "App UID must be valid.",
  PLEASE_SELECT_APP_FROM_LIST: "Please select an app from the list",
  DELETE_CONFIRMATION: "Are you sure you want to delete this app?",
}

const installAppMsg = {
  CHOOSE_A_STACK: "Please select a stack",
  APP_INSTALLED_SUCCESSFULLY: "{app} installed successfully in {target}.",
  INSTALL_ORG_APP_TO_STACK: "{app} is an organization app. It cannot be installed to a stack. Do you want to proceed?",
  MISSING_STACK_API_KEY: "As {app} is a stack app, it can only be installed in a stack. Please select a stack.",
  INSTALLING_APP_NOTICE: "Installing {app} on {type} {target}.",
  APP_ALREADY_INSTALLED: "Please use $ csdx app:reinstall to reinstall the app.",
}

const uninstallAppMsg = {
  CHOOSE_AN_INSTALLATION: "Please select the stack from where the app must be uninstalled",
  INSTALLATION_UID: "Provide the installation ID of the app that needs to be uninstalled.",
  NO_INSTALLATIONS_FOUND: "Cannot find any installations for this app.",
  APP_UNINSTALLED: "{app} uninstalled successfully.",
  UNINSTALLING_APP: "Uninstalling app from {type}...",
  UNINSTALL_ALL: "Please select stacks from where the app must be uninstalled.",
}

const reinstallAppMsg = {
  CHOOSE_A_STACK: "Please select a stack",
  APP_REINSTALLED_SUCCESSFULLY: "{app} reinstalled successfully in {target}.",
  REINSTALL_ORG_APP_TO_STACK: "{app} is an organization app. It cannot be reinstalled to a stack. Do you want to proceed?",
  MISSING_STACK_API_KEY: "As {app} is a stack app, it can only be reinstalled in a stack. Please select a stack.",
  REINSTALLING_APP_NOTICE: "Reinstalling {app} on {type} {target}.",
  APP_UID: "Provide the app UID of an existing app to be reinstalled.",
}

const deployAppMsg = {
  APP_DEPLOYED: "{app} has been deployed successfully.",
  FORCE_DISCONNECT: "Force disconnect launch project by skipping the confirmation",
  LAUNCH_PROJECT: "Choose a new or an existing Launch project.",
  APP_URL: "Please enter the URL of the app you want to deploy.",
  HOSTING_TYPE: "Choose a valid Hosting Type.",
  CONFIG_FILE: "[optional] Please enter the path of the config file.",
  APP_UPDATE_TERMINATION_MSG: "The app is already connected to the Launch project. Skipping the app hosting updates process.",
  DISCONNECT_PROJECT: "Are you sure you wan to disconnect the Launch project?",
  PROJECT_NOT_FOUND: "We couldn't find the project. Please enter a valid project name.",
  PROJECT_NAME_CONFLICT_FAILED: "Unable to resolve the project name conflict."
}

const messages: typeof errors &
  typeof commonMsg &
  typeof appCreate &
  typeof appUpdate &
  typeof getAppMsg &
  typeof deleteAppMsg &
  typeof installAppMsg &
  typeof uninstallAppMsg &
  typeof reinstallAppMsg &
  typeof deployAppMsg= {
  ...errors,
  ...commonMsg,
  ...appCreate,
  ...appUpdate,
  ...getAppMsg,
  ...deleteAppMsg,
  ...installAppMsg,
  ...uninstallAppMsg,
  ...reinstallAppMsg,
  ...deployAppMsg
};

const $t = (msg: string, args: Record<string, string>): string => {
  if (!msg) return "";

  for (const key of Object.keys(args)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const placeholder = `{${escapedKey}}`;
    msg = msg.split(placeholder).join(args[key]);
  }

  return msg;
};

export default messages;
export { $t, errors, commonMsg, appCreate, appUpdate, getAppMsg, deleteAppMsg, installAppMsg, uninstallAppMsg, reinstallAppMsg, deployAppMsg };
