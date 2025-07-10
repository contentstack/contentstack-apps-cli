import map from "lodash/map";
import { ApolloClient } from "@contentstack/cli-launch";
import {
  ContentstackClient,
  FlagInput,
  ContentstackMarketplaceClient,
  cliux,
  Stack,
  FsUtility,
  HttpClient,
} from "@contentstack/cli-utilities";
import { projectsQuery } from "../graphql/queries";
import {
  AppLocation,
  Extension,
  LaunchProjectRes,
  LogFn,
  UpdateHostingParams,
} from "../types";
import { askProjectName } from "./inquirer";
import { deployAppMsg } from "../messages";
import config from "../config";
import find from "lodash/find";

export type CommonOptions = {
  log: LogFn;
  managementSdk: ContentstackClient;
};
export type MarketPlaceOptions = {
  log: LogFn;
  marketplaceSdk: ContentstackMarketplaceClient;
};

async function getOrganizations(
  options: CommonOptions,
  skip = 0,
  organizations: Record<string, any>[] = []
): Promise<Record<string, any>[]> {
  const { log, managementSdk } = options;
  const response = await managementSdk
    .organization()
    .fetchAll({ limit: 100, asc: "name", include_count: true, skip: skip })
    .catch((error) => {
      log("Unable to fetch organizations.", "warn");
      log(error, "error");
      throw error;
    });

  if (response) {
    organizations = organizations.concat(response.items as any);
    if (organizations.length < response.count) {
      organizations = await getOrganizations(options, skip + 100);
    }
  }

  return organizations;
}

function getOrgAppUiLocation(): Extension[] {
  const orgConfigLocation = {
    type: AppLocation.ORG_CONFIG,
    meta: [
      {
        path: "/app-configuration",
        signed: true,
        enabled: true,
      },
    ],
  };
  return [orgConfigLocation];
}

async function fetchApps(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions,
  skip = 0,
  apps: Record<string, any>[] = []
): Promise<Record<string, any>[]> {
  const { log, marketplaceSdk } = options;
  const response = await marketplaceSdk
    .marketplace(orgUid)
    .findAllApps({
      limit: 50,
      asc: "name",
      include_count: true,
      skip: skip,
      target_type: flags["app-type"],
    })
    .catch((error) => {
      cliux.loader("failed");
      log("Some error occurred while fetching apps.", "warn");
      throw error;
    });

  if (response) {
    apps = apps.concat(response.items as any);
    if (apps.length < response.count) {
      apps = await fetchApps(flags, orgUid, options, skip + 50, apps);
    }
  }

  return apps;
}

function fetchApp(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk } = options;
  const app: any = flags["app-uid"];
  return marketplaceSdk
    .marketplace(orgUid)
    .app(app as string)
    .fetch();
}

function fetchAppInstallations(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk } = options;
  const app: any = flags["app-uid"];
  return marketplaceSdk
    .marketplace(orgUid)
    .app(app as string)
    .listInstallations()
    .catch((error: any) => {
      const { log } = options;
      cliux.loader("failed");
      log("Some error occurred while fetching app installations.", "warn");
      throw error; // throwing error here instead of removing the catch block, as the loader needs to stopped in case there is an error.
    });
}

function deleteApp(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk } = options;
  const app: any = flags["app-uid"];
  return marketplaceSdk
    .marketplace(orgUid)
    .app(app as string)
    .delete();
}

function installApp(
  flags: FlagInput,
  orgUid: string,
  type: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk } = options;
  return marketplaceSdk
    .marketplace(orgUid)
    .app(flags["app-uid"] as any)
    .install({
      targetUid: (flags["stack-api-key"] as any) || orgUid,
      targetType: type as any,
    });
}

function reinstallApp(
  flags: FlagInput,
  orgUid: string,
  type: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk } = options;
  return marketplaceSdk
    .marketplace(orgUid)
    .app(flags["app-uid"] as any)
    .reinstall({
      targetUid: (flags["stack-api-key"] as any) || orgUid,
      targetType: type as any,
    });
}

function fetchStack(flags: FlagInput, options: CommonOptions): Promise<any> {
  const { managementSdk } = options;
  return managementSdk
    .stack({ api_key: flags["stack-api-key"] as any })
    .fetch();
}

async function getStacks(
  options: CommonOptions,
  orgUid: string,
  skip: number = 0,
  stacks: Stack[] = []
): Promise<Stack[]> {
  const { log, managementSdk } = options;
  const response = await managementSdk
    .organization(orgUid)
    .stacks({ include_count: true, limit: 100, asc: "name", skip: skip })
    .catch((error) => {
      cliux.loader("failed");
      log("Unable to fetch stacks.", "warn");
      log(error?.errorMessage || error, "error");
      throw error;
    });

  if (response) {
    stacks = stacks.concat(response.items as any);
    if (stacks.length < response.count) {
      stacks = await getStacks(options, orgUid, skip + 100, stacks);
    }
  }

  return stacks;
}

function uninstallApp(
  orgUid: string,
  options: MarketPlaceOptions,
  installationUid: string
) {
  const { marketplaceSdk } = options;
  // const app: any = flags["app-uid"];
  return marketplaceSdk
    .marketplace(orgUid)
    .installation(installationUid)
    .uninstall();
}

async function fetchInstalledApps(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions
) {
  const { marketplaceSdk, log } = options;
  const apps = (await fetchApps(flags, orgUid, options)) || [];
  let batchRequests = [];
  // Make calls in batch. 10 requests per batch allowed.
  while (apps.length) {
    batchRequests.push(apps.splice(0, 10));
  }
  const results = [];
  for (const batch of batchRequests) {
    const promises = batch.map(async (app) => {
      try {
        const installations = await marketplaceSdk
          .marketplace(orgUid)
          .app(app.uid)
          .listInstallations();
        return installations.items.length ? installations.items : null;
      } catch (error) {
        log("Unable to fetch installations.", "warn");
        log(error, "error");
        throw error;
      }
    });
    results.push(await Promise.all(promises));
  }
  for (let i = batchRequests.length - 1; i >= 0; i--) {
    const batchLength = batchRequests[i].length;
    for (let j = batchLength - 1; j >= 0; j--) {
      if (!results[i][j]) {
        batchRequests[i].splice(j, 1);
        results[i].splice(j, 1);
      }
    }
  }
  return batchRequests.flat();
}

// To remove the relative path
const sanitizePath = (str: string) =>
  str
    ?.replace(/^([\/\\]){2,}/, "./") // Normalize leading slashes/backslashes to ''
    .replace(/[\/\\]+/g, "/") // Replace multiple slashes/backslashes with a single '/'
    .replace(/(\.\.(\/|\\|$))+/g, ""); // Remove directory traversal (../ or ..\)

async function updateApp(
  flags: FlagInput,
  orgUid: string,
  options: CommonOptions,
  updateReqPayload: UpdateHostingParams
) {
  const { managementSdk } = options;
  const appUid: any = flags["app-uid"];
  const payload = {
    uid: appUid,
    hosting: updateReqPayload,
  };
  let app = managementSdk.organization(orgUid).app(appUid as string);
  app = Object.assign(app, payload);
  await app.update();
}

async function getProjects(
  apolloClient: ApolloClient<any>
): Promise<LaunchProjectRes[]> {
  const projects: any = await apolloClient
    .query({ query: projectsQuery, variables: { query: {} } })
    .then(({ data: { projects } }: { data: { projects: any } }) => projects);

  return map(
    projects.edges,
    ({
      node: {
        uid,
        name,
        latestDeploymentStatus,
        integrations: { developerHubApp },
      },
    }) => ({
      name,
      uid,
      url: latestDeploymentStatus?.deployment?.url || null,
      environmentUid: latestDeploymentStatus?.environment?.uid || null,
      developerHubAppUid: developerHubApp?.uid || null,
    })
  );
}

function getManifestDetails(
  flags: FlagInput,
  orgUid: string,
  options: CommonOptions
) {
  const { managementSdk } = options;
  const app: any = flags["app-uid"];
  return managementSdk
    .organization(orgUid)
    .app(app as string)
    .hosting();
}

function setupConfig(configPath: string) {
  const configDetails: Record<string, string> = {};
  if (configPath) {
    const config = new FsUtility().readFile(configPath, true) as Record<
      string,
      any
    >;
    configDetails["name"] = config?.name;
    configDetails["type"] = config?.type;
    configDetails["environment"] = config?.environment;
    configDetails["framework"] = config?.framework;
    configDetails["build-command"] = config?.buildCommand;
    configDetails["out-dir"] = config?.outDir;
    configDetails["branch"] = config?.branch;
  }
  return configDetails;
}

async function disconnectApp(
  flags: FlagInput,
  orgUid: string,
  options: MarketPlaceOptions
): Promise<any> {
  const { marketplaceSdk } = options;
  return marketplaceSdk
    .marketplace(orgUid)
    .app(flags["app-uid"] as any)
    .hosting()
    .disconnect({ provider: "launch" });
}

function formatUrl(url: string): string {
  return url ? (url.startsWith("https") ? url : `https://${url}`) : "";
}

const handleProjectNameConflict = async (
  projectName: string,
  projects: any[],
  retry = 1
): Promise<string> => {
  if (retry > 3) {
    throw new Error(deployAppMsg.PROJECT_NAME_CONFLICT_FAILED);
  }
  const project = projects.find((project) => project.name === projectName);
  if (project) {
    projectName = await askProjectName(projectName);
    return handleProjectNameConflict(projectName, projects, retry + 1);
  }
  return projectName;
};
async function fetchBoilerplateDetails(): Promise<Record<string, any>[]> {
  try {
    const content = await new HttpClient().get(config.boilerplatesUrl);
    return content?.data?.templates ?? [];
  } catch (error) {
    throw error;
  }
}

async function validateBoilerplate(boilerplateName: string) {
  const boilerplates = await fetchBoilerplateDetails();
  const boilerplate = find(
    boilerplates,
    (boilerplate) => boilerplate.name === boilerplateName
  );
  if (!boilerplate) {
    throw new Error(
      "Invalid boilerplate! Please select a boilerplate from the following options: App Boilerplate, DAM App Boilerplate or Ecommerce App Boilerplate"
    );
  }
  return boilerplate;
}

export {
  getOrganizations,
  getOrgAppUiLocation,
  fetchApps,
  fetchApp,
  fetchAppInstallations,
  deleteApp,
  installApp,
  getStacks,
  fetchStack,
  uninstallApp,
  fetchInstalledApps,
  reinstallApp,
  sanitizePath,
  updateApp,
  getProjects,
  getManifestDetails,
  setupConfig,
  disconnectApp,
  formatUrl,
  handleProjectNameConflict,
  fetchBoilerplateDetails,
  validateBoilerplate,
};
