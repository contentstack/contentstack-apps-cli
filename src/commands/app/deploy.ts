import { ApolloClient } from "@apollo/client/core";
import { Flags, FlagInput } from "@contentstack/cli-utilities";
import config from "@contentstack/cli-launch/dist/config";
import { GraphqlApiClient } from "@contentstack/cli-launch/dist/util";
import Launch from "@contentstack/cli-launch/dist/commands/launch/index";
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
} from "../../util";
import { UpdateHostingParams } from "../../types";

export default class Deploy extends AppCLIBaseCommand {
  static description = "Deploy an app";

  static examples = [
    "$ <%= config.bin %> <%= command.id %>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --hosting-type <Hosting with Launch>",
    "$ <%= config.bin %> <%= command.id %> --org <UID> --app-uid <APP-UID-1> --app-url <https://localhost:3000>",
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
    "project-type": Flags.string({
      multiple: false,
      options: ["existing-project", "new-project"],
      description: deployAppMsg.PROJECT_TYPE,
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

      await updateApp(
        flags,
        this.sharedConfig.org,
        {
          managementSdk: this.managementAppSdk,
          log: this.log,
        },
        updateHostingPayload
      );

      this.log(
        this.$t(deployAppMsg.APP_DEPLOYED, {
          app: app?.name || flags["app-uid"],
        }),
        "info"
      );
      this.log(`App URL: ${flags["app-url"]}`, "info");
    } catch (error: any) {
      console.log("error", error);
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
      (project) => project.developerHubAppUid === this.flags["app-uid"]
    );
    if (isProjectConnected?.length) {
      this.flags["yes"] = this.flags["yes"] || (await askConfirmation());
      if (!this.flags["yes"]) {
        this.log(
          deployAppMsg.LAUNCH_PROJECT_SKIP_MSG,
          "info"
        );
        return;
      }
      await disconnectApp(
        this.flags,
        this.sharedConfig.org,
        this.developerHubBaseUrl
      );
    }
    this.flags["project-type"] =
      this.flags["project-type"] || (await askProjectType());
    await this.handleProjectType(config, updateHostingPayload, projects);
  }

  async handleProjectType(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams,
    projects: any[]
  ): Promise<void> {
    let url: string = "";

    if (this.flags["project-type"] === "existing-project") {
      url = await this.handleExistingProject(updateHostingPayload, projects);
    } else if (this.flags["project-type"] === "new-project") {
      url = await this.handleNewProject(config, updateHostingPayload);
    } else {
      this.log("Invalid project type", "error");
      return;
    }

    this.flags["app-url"] = formatUrl(url);
    updateHostingPayload["deployment_url"] = this.flags["app-url"];
  }

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

  async handleNewProject(
    config: Record<string, string>,
    updateHostingPayload: UpdateHostingParams
  ): Promise<string> {
    await Launch.run([
      "--org",
      this.sharedConfig.org,
      "--name",
      config["name"],
      "--type",
      config["type"],
      "--environment",
      config["environment"],
      "--framework",
      config["framework"],
      "--build-command",
      config["build-command"],
      "--out-dir",
      config["out-dir"],
      "--branch",
      config["branch"],
    ]);
    updateHostingPayload["deployment_url"] = this.flags["app-url"];
    return "";
  }
}
