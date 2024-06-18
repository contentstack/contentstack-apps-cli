import { ApolloClient } from "@apollo/client/core";
import { Flags, FlagInput, cliux } from "@contentstack/cli-utilities";
import config from "@contentstack/cli-launch/dist/config";
import { GraphqlApiClient } from "@contentstack/cli-launch/dist/util";
import Launch from "@contentstack/cli-launch/dist/commands/launch/index";

import { UpdateHostingParams } from "../../types";
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
} from "../../util";

export default class Deploy extends AppCLIBaseCommand {
  static description = "Deploy an app";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Custom Hosting> --app-url <https://localhost:3000>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project-type <existing-project>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch> --launch-project-type <existing-project> --config <config-path>",
  ];

  static flags: FlagInput = {
    "app-uid": Flags.string({
      description: commonMsg.APP_UID,
    }),
    "hosting-type": Flags.string({
      description: deployAppMsg.HOSTING_TYPE,
    }),
    "app-url": Flags.string({
      description: deployAppMsg.APP_URL,
    }),
    yes: Flags.boolean({
      char: "y",
      description: deployAppMsg.FORCE_DISCONNECT,
      default: false,
    }),
    "launch-project-type": Flags.string({
      multiple: false,
      options: ["existing-project", "new-project"],
      description: deployAppMsg.LAUNCH_PROJECT_TYPE,
    }),
    config: Flags.string({
      char: "c",
      description: deployAppMsg.CONFIG_FILE,
    }),
  };

  async run(): Promise<void> {
    try {
      const { flags } = this;
      flags["app-uid"] = this.manifestData?.uid ?? flags["app-uid"];
      this.sharedConfig.org = await this.getOrganization();
      const app = await this.fetchAppDetails();

      flags["hosting-type"] = flags["hosting-type"] || (await getHostingType());
      const updateHostingPayload: UpdateHostingParams = {
        provider: "external",
        deployment_url: "",
        environment_uid: "",
        project_uid: "",
      };

      switch (flags["hosting-type"]) {
        case "Custom Hosting":
          flags["app-url"] = flags["app-url"] || (await getAppUrl());
          break;
        case "Hosting with Launch":
          updateHostingPayload["provider"] = "launch";
          const config = setupConfig(flags["config"]);
          config["name"] = config["name"] || app?.name;
          await this.handleHostingWithLaunch(config, updateHostingPayload);
          break;
        default:
          this.log("Invalid hosting type", "error");
          return;
      }

      if (flags["app-url"]) {
        const spinner = cliux.loaderV2("Updating App...");
        await updateApp(
          flags,
          this.sharedConfig.org,
          {
            managementSdk: this.managementAppSdk,
            log: this.log,
          },
          updateHostingPayload
        );
        cliux.loaderV2("done", spinner);
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
      this.exit(1);
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
    return (
      this.manifestData?.organization_uid ??
      (await getOrg(this.flags, {
        managementSdk: this.managementSdk,
        log: this.log,
      }))
    );
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
    const baseUrl =
      config.launchBaseUrl ||
      (config.launchHubUrls as Record<string, string>)[this.cmaAPIUrl];
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
   * Handles hosting with launch for the application deployment.
   *
   * @param config - The configuration object.
   * @param updateHostingPayload - The payload for updating hosting.
   * @returns A Promise that resolves when the hosting with launch is handled.
   */
  async handleHostingWithLaunch(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams
  ): Promise<void> {
    const apolloClient = await this.getApolloClient();
    const projects = await getProjects(apolloClient);
    const isProjectConnected = projects.filter(
      (project) => project?.developerHubAppUid === this.flags["app-uid"]
    );

    if (isProjectConnected?.length) {
      this.flags["yes"] = this.flags["yes"] || (await askConfirmation());
      if (!this.flags["yes"]) {
        throw new Error(deployAppMsg.APP_UPDATE_TERMINATION_MSG);
      }
      const spinner = cliux.loaderV2("Disconnecting launch project...");
      await disconnectApp(
        this.flags,
        this.sharedConfig.org,
        this.developerHubBaseUrl
      );
      cliux.loaderV2("disconnected...", spinner);
    }
    this.flags["launch-project-type"] =
      this.flags["launch-project-type"] || (await askProjectType());
    await this.handleProjectType(config, updateHostingPayload, projects);
  }

  /**
   * Handles the project type based on the provided configuration, update hosting payload, and projects.
   * @param config - The configuration object.
   * @param updateHostingPayload - The update hosting payload.
   * @param projects - The list of projects.
   * @returns A Promise that resolves to void.
   */
  async handleProjectType(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams,
    projects: any[]
  ): Promise<void> {
    let url: string = "";

    if (this.flags["launch-project-type"] === "existing-project") {
      url = await this.handleExistingProject(updateHostingPayload, projects);
    } else if (this.flags["launch-project-type"] === "new-project") {
      config["name"] = await handleProjectNameConflict(
        config["name"],
        projects
      );
      url = await this.handleNewProject(config, updateHostingPayload);
    } else {
      this.log("Invalid project type", "error");
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
}
