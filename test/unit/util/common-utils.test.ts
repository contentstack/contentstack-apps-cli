import { fancy } from "fancy-test";
import { expect } from "@oclif/test";
import {
  cliux,
  configHandler,
  ContentstackClient,
  managementSDKClient,
} from "@contentstack/cli-utilities";

import { LogFn } from "../../../src/types";
import * as mock from "../mock/common.mock.json";
import { fetchApps, getOrganizations } from "../../../src/util/common-utils";
import { getDeveloperHubUrl } from "../../../src/util/inquirer";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();


describe("common utils", () => {
  const log: LogFn = () => {};
  let managementSdk: ContentstackClient;
  let managementAppSdk: ContentstackClient;

  before(async () => {
    managementSdk = await managementSDKClient({
      host: region.cma.replace("https://", ""),
    });
    managementAppSdk = await managementSDKClient({
      host: developerHubBaseUrl,
    });
  });

  describe("getOrganizations", () => {
    describe("Get list of organizations", () => {
      fancy
        .nock(region.cma, (api) =>
          api
            .get(
              "/v3/organizations?limit=100&asc=name&include_count=true&skip=0"
            )
            .reply(200, { organizations: mock.organizations })
        )
        .it("Returns list of org", async () => {
          const [org1, org2] = await getOrganizations({ log, managementSdk });
          expect(org1.uid).to.equal(mock.organizations[0].uid);
          expect(org2.uid).to.equal(mock.organizations[1].uid);
        });
    });

    describe("Get list of organizations using pagination", () => {
      fancy
        .nock(region.cma, (api) =>
          api
            .get(
              "/v3/organizations?limit=100&asc=name&include_count=true&skip=0"
            )
            .reply(200, { organizations: mock.organizations, count: 110 })
        )
        .nock(region.cma, (api) =>
          api
            .get(
              "/v3/organizations?limit=100&asc=name&include_count=true&skip=100"
            )
            .reply(200, { organizations: mock.organizations, count: 0 })
        )
        .it("returns list of organizations", async () => {
          const organizations = await getOrganizations({ log, managementSdk });
          const [org1, org2] = organizations;
          expect(org1.uid).to.equal(mock.organizations[0].uid);
          expect(org2.uid).to.equal(mock.organizations[1].uid);
        });
    });

    describe("Get list of organizations failure case", async () => {
      fancy
        .nock(region.cma, (api) =>
          api
            .get(
              "/v3/organizations?limit=100&asc=name&include_count=true&skip=0"
            )
            .reply(400)
        )
        .do(async () => await getOrganizations({ log, managementSdk }))
        .catch((err) => {
          const { status }: { status: number } = JSON.parse(err.message);
          expect(status).to.equal(400);
        })
        .it("API fails with status code 400");
    });
  });

  describe("fetchApps", () => {
    describe("Get list of Apps", () => {
      fancy
        .stub(cliux, "loader", () => {})
        .nock(`https://${developerHubBaseUrl}`, (api) =>
          api
            .get(
              "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
            )
            .reply(200, {
              data: mock.apps,
            })
        )
        .it("Returns list of apps", async () => {
          const [app] = await fetchApps(
            { "app-type": "stack" as any },
            "test-uid-1",
            {
              log,
              managementSdk: managementAppSdk,
            }
          );
          expect(app.uid).to.equal(mock.apps[0].uid);
        });
    });

    describe("Get list of Apps API fail case", () => {
      fancy
        .stub(cliux, "loader", () => {})
        .nock(`https://${developerHubBaseUrl}`, (api) =>
          api
            .get(
              "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
            )
            .reply(400)
        )
        .do(
          async () =>
            await fetchApps({ "app-type": "stack" as any }, "test-uid-1", {
              log,
              managementSdk: managementAppSdk,
            })
        )
        .catch(({ message }) => expect(message).to.contains('"status":400'))
        .it("Returns error code with 400");
    });
  });
});
