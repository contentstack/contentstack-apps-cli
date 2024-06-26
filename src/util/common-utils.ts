import { ContentstackClient, FlagInput, ContentstackMarketplaceClient } from "@contentstack/cli-utilities";
import { AppLocation, Extension, LogFn } from "../types";
import { cliux, Stack } from "@contentstack/cli-utilities";
import { apiRequestHandler } from "./api-request-handler";

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

function fetchApp(flags: FlagInput, orgUid: string, options: MarketPlaceOptions) {
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
  options: CommonOptions
) {
  const { managementSdk } = options;
  const app: any = flags["app-uid"];
  return managementSdk
    .organization(orgUid)
    .app(app as string)
    .installation()
    .findAll()
    .catch((error) => {
      const { log } = options;
      cliux.loader("failed");
      log("Some error occurred while fetching app installations.", "warn");
      throw error; // throwing error here instead of removing the catch block, as the loader needs to stopped in case there is an error.
    });
}

function deleteApp(flags: FlagInput, orgUid: string, options: MarketPlaceOptions) {
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

async function reinstallApp(params: {
  flags: FlagInput;
  type: string;
  developerHubBaseUrl: string;
  orgUid: string;
  manifestUid: string;
}): Promise<void> {
  const { type, developerHubBaseUrl, flags, orgUid, manifestUid } = params;
  const payload = {
    target_type: type,
    target_uid: (flags["stack-api-key"] as any) || orgUid,
  };

  const url = `https://${developerHubBaseUrl}/manifests/${manifestUid}/reinstall`;
  try {
    const result = await apiRequestHandler({
      orgUid,
      payload,
      url,
      method: "PUT",
    });
    return result;
  } catch (err) {
    throw err;
  }
}

function fetchStack(flags: FlagInput, options: CommonOptions) {
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
  flags: FlagInput,
  orgUid: string,
  options: CommonOptions,
  installationUid: string
) {
  const { managementSdk } = options;
  const app: unknown = flags["app-uid"];
  return managementSdk
    .organization(orgUid)
    .app(app as string)
    .installation(installationUid as string)
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
const sanitizePath = (str: string) => str?.replace(/^(\.\.(\/|\\|$))+/, "");

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
};
