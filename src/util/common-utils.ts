import { ContentstackClient } from "@contentstack/cli-utilities";
import { AppLocation, Extension, LogFn } from "../types";

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
      process.exit(1);
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

async function getApps(
  orgUid: string,
  options: CommonOptions,
  skip = 0,
  apps: Record<string, any>[] = []
): Promise<Record<string, any>[]> {
  const { log, managementSdk } = options;
  const response = await managementSdk
    .organization(orgUid)
    .app()
    .findAll({ limit: 50, asc: "name", include_count: true, skip: skip})
    .catch((error) => {
      log("Some error occurred while fetching apps.", "warn");
      log(error, "error");
      process.exit(1);
    });
  
  if (response) {
    apps = apps.concat(response.items as any);
    if (apps.length < response.count) {
      apps = await getApps(orgUid, options, skip + 50, apps)
    }
  }

  return apps;
}

export { getOrganizations, getOrgAppUiLocation, getApps };
