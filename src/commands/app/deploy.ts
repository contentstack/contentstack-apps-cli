import { ApolloClient } from "@apollo/client/core";
import { Flags, FlagInput } from "@contentstack/cli-utilities";
import config from "@contentstack/cli-launch/dist/config";
import { GraphqlApiClient } from "@contentstack/cli-launch/dist/util";
import Launch from "@contentstack/cli-launch/dist/commands/launch/index";

import { LaunchProjectRes, UpdateHostingParams } from "../../types";
import { commonMsg, deployAppMsg } from "../../messages";
import { AppCLIBaseCommand } from "../../app-cli-base-command";
import {
  getOrg,
  fetchApp,
  getHostingType,
  updateApp,
  getAppUrl,
  selectProject,
  getProjects,
  getApp,
  askConfirmation,
  askProjectType,
  setupConfig,
  disconnectApp,
  formatUrl,
  handleProjectNameConflict,
  getLaunchHubUrl,
} from "../../util";

export default class Deploy extends AppCLIBaseCommand {
  static description = "Deploy an app";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Custom Hosting> --app-url <https://localhost:3000>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <existing>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <new>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project <new> --config <config-path>",
  ];

  static flags: FlagInput = {
    "app-uid": Flags.string({
      description: commonMsg.APP_UID,
    }),
    "hosting-type": Flags.string({
      multiple: false,
      options: ["Hosting with Launch", "Custom Hosting"],
      description: deployAppMsg.HOSTING_TYPE,
    }),
    "app-url": Flags.string({
      description: deployAppMsg.APP_URL,
    }),
    "launch-project": Flags.string({
      multiple: false,
      options: ["existing", "new"],
      description: deployAppMsg.LAUNCH_PROJECT,
    }),
    config: Flags.string({
      char: "c",
      description: deployAppMsg.CONFIG_FILE,
    }),
    ...AppCLIBaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    try {
      const { flags } = this;
      flags["app-uid"] = this.manifestData?.uid ?? flags["app-uid"];
      this.sharedConfig.org = await this.getOrganization();
      const app = await this.fetchAppDetails();
      this.flags["app-uid"] = app?.uid || "";

      const apolloClient = await this.getApolloClient();
      const projects = await getProjects(apolloClient);
      await this.handleAppDisconnect(projects);

      flags["hosting-type"] = flags["hosting-type"] || (await getHostingType());
      const updateHostingPayload: UpdateHostingParams = {
        provider: "external",
        deployment_url: "",
      };

      switch (flags["hosting-type"]) {
        case "Custom Hosting":
          flags["app-url"] = flags["app-url"] || (await getAppUrl());
          this.flags["app-url"] = formatUrl(flags["app-url"]);
          updateHostingPayload["deployment_url"] = this.flags["app-url"];
          break;
        case "Hosting with Launch":
          updateHostingPayload["provider"] = "launch";
          const config = setupConfig(flags["config"]);
          config["name"] = config["name"] || app?.name;
          this.flags["launch-project"] =
            this.flags["launch-project"] || (await askProjectType());
          await this.handleHostingWithLaunch(
            config,
            updateHostingPayload,
            projects
          );
          break;
        default:
          this.log("Please provide a valid Hosting Type.", "error");
          return;
      }

      if (this.flags["app-uid"]) {
        await updateApp(
          flags,
          this.sharedConfig.org,
          {
            managementSdk: this.managementAppSdk,
            log: this.log,
          },
          updateHostingPayload
        );
      }

      this.log(
        this.$t(deployAppMsg.APP_DEPLOYED, {
          app: app?.name || flags["app-uid"],
        }),
        "info"
      );
      this.log(`App URL: ${flags["app-url"]}`, "info");
    } catch (error: any) {
      this.log(error?.errorMessage || error?.message || error, "error");
      process.exit(1);
    }
  }

  /**
   * Retrieves the organization UID for the app deployment.
   * If the organization UID is already available in the manifest data, it is returned.
   * Otherwise, it makes an API call to retrieve the organization UID using the provided flags and management SDK.
   *
   * @returns A Promise that resolves to the organization UID.
   */
  async getOrganization(): Promise<string> {
    this.sharedConfig.org = this.manifestData?.organization_uid;
    if (this.sharedConfig.org) {
      return this.sharedConfig.org;
    }
    return await getOrg(this.flags, {
      managementSdk: this.managementSdk,
      log: this.log,
    });
  }

  /**
   * Fetches the details of an app.
   * If the "app-uid" flag is provided, it fetches the app details using the fetchApp function.
   * Otherwise, it fetches the app details using the getApp function.
   * @returns A Promise that resolves to the fetched app details.
   */
  async fetchAppDetails(): Promise<any> {
    if (!this.flags["app-uid"]) {
      return await getApp(this.flags, this.sharedConfig.org, {
        marketplaceSdk: this.marketplaceAppSdk,
        log: this.log,
      });
    }
    return await fetchApp(this.flags, this.sharedConfig.org, {
      marketplaceSdk: this.marketplaceAppSdk,
      log: this.log,
    });
  }

  /**
   * Retrieves the Apollo Client instance for making GraphQL API requests.
   * @returns {Promise<ApolloClient>} The Apollo Client instance.
   */
  async getApolloClient(projectUid = ""): Promise<ApolloClient<any>> {
    const baseUrl = config.launchBaseUrl || getLaunchHubUrl();
    const manageApiBaseUrl = `${baseUrl}/${config.manageApiEndpoint}`;
    return await new GraphqlApiClient({
      headers: {
        "X-CS-CLI": this.context.analyticsInfo,
        "x-project-uid": projectUid,
        organization_uid: this.sharedConfig.org,
      },
      baseUrl: manageApiBaseUrl,
    }).apolloClient;
  }

  /**
   * Handles the project type based on the provided configuration, update hosting payload, and projects.
   * @param config - The configuration object.
   * @param updateHostingPayload - The update hosting payload.
   * @param projects - The list of projects.
   * @returns A Promise that resolves to void.
   */
  async handleHostingWithLaunch(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams,
    projects: any[]
  ): Promise<void> {
    let url: string = "";

    if (this.flags["launch-project"] === "existing") {
      url = await this.handleExistingProject(updateHostingPayload, projects);
    } else if (this.flags["launch-project"] === "new") {
      config["name"] = await handleProjectNameConflict(
        config["name"],
        projects
      );
      url = await this.handleNewProject(config, updateHostingPayload);
    } else {
      this.log("Please provide a valid launch project.", "error");
      return;
    }

    this.flags["app-url"] = formatUrl(url);
    updateHostingPayload["deployment_url"] = this.flags["app-url"];
  }

  /**
   * Handles an existing project by updating the hosting payload and returning the project URL.
   * @param updateHostingPayload - The payload containing the updated hosting information.
   * @param projects - An array of projects to choose from.
   * @returns A Promise that resolves to the project URL if a project is selected, otherwise an empty string.
   */
  async handleExistingProject(
    updateHostingPayload: UpdateHostingParams,
    projects: any[]
  ): Promise<string> {
    const selectedProject = await selectProject(projects);
    if (selectedProject) {
      updateHostingPayload["environment_uid"] = selectedProject.environmentUid;
      updateHostingPayload["project_uid"] = selectedProject.uid;
      return selectedProject.url || "";
    }
    return "";
  }

  /**
   * Handles the deployment of a new project.
   *
   * @param config - The configuration object containing project details.
   * @param updateHostingPayload - The payload for updating hosting parameters.
   * @returns The URL of the deployed project.
   */
  async handleNewProject(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams
  ): Promise<string> {
    const args = [];
    const configMappings = {
      org: this.sharedConfig.org,
      name: config["name"],
      type: config["type"],
      environment: config["environment"],
      framework: config["framework"],
      "build-command": config["build-command"],
      "out-dir": config["out-dir"],
      branch: config["branch"],
    };

    for (const [key, value] of Object.entries(configMappings)) {
      if (config[key]) {
        args.push(`--${key}`, value);
      }
    }

    await Launch.run(args);
    const apolloClient = await this.getApolloClient();
    const projects = await getProjects(apolloClient);
    const project = projects.find((project) => project.name === config["name"]);
    if (project) {
      updateHostingPayload["environment_uid"] = project.environmentUid;
      updateHostingPayload["project_uid"] = project.uid;
      return project.url || "";
    }
    return "";
  }

  /**
   * Handles the disconnection of an app from projects.
   *
   * @param projects - An array of LaunchProjectRes objects representing the projects.
   * @returns {Promise<void>} - A promise that resolves when the disconnection is complete.
   * @throws {Error} - Throws an error if the user chooses not to disconnect the app.
   */
  async handleAppDisconnect(projects: LaunchProjectRes[]): Promise<void> {
    const isProjectConnected = projects.filter(
      (project) => project?.developerHubAppUid === this.flags["app-uid"]
    );

    if (isProjectConnected?.length) {
      this.flags["yes"] = this.flags["yes"] || (await askConfirmation());
      if (!this.flags["yes"]) {
        throw new Error(deployAppMsg.APP_UPDATE_TERMINATION_MSG);
      }
      await disconnectApp(this.flags, this.sharedConfig.org, {
        marketplaceSdk: this.marketplaceAppSdk,
        log: this.log,
      });
    }
  }
}
