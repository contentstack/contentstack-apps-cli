import { ContentstackClient, FlagInput } from "@contentstack/cli-utilities";
import { AppLocation, Extension, LogFn } from "../types";
import { cliux, Stack } from "@contentstack/cli-utilities";

export type CommonOptions = {
  log: LogFn;
  managementSdk: ContentstackClient;
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
  options: CommonOptions,
  skip = 0,
  apps: Record<string, any>[] = []
): Promise<Record<string, any>[]> {
  const { log, managementSdk } = options;
  const response = await managementSdk
    .organization(orgUid)
    .app()
    .findAll({
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

function fetchApp(flags: FlagInput, orgUid: string, options: CommonOptions) {
  const { managementSdk } = options;
  const app: any = flags["app-uid"];
  return managementSdk
    .organization(orgUid)
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

function deleteApp(flags: FlagInput, orgUid: string, options: CommonOptions) {
  const { managementSdk } = options;
  const app: any = flags["app-uid"];
  return managementSdk
    .organization(orgUid)
    .app(app as string)
    .delete();
}

function installApp(
  flags: FlagInput,
  orgUid: string,
  type: string,
  options: CommonOptions
) {
  const { managementSdk } = options;
  return managementSdk
    .organization(orgUid)
    .app(flags["app-uid"] as any)
    .install({
      targetUid: (flags["stack-api-key"] as any) || orgUid,
      targetType: type as any,
    });
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
  options: CommonOptions
) {
  const { managementSdk, log } = options;
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
        const installations = await managementSdk
          .organization(orgUid)
          .app(app.uid)
          .installation()
          .findAll();
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
};
