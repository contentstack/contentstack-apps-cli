import { fancy } from "fancy-test";
import { expect } from "@oclif/test";
import {
  configHandler,
  ContentstackClient,
  managementSDKClient,
} from "@contentstack/cli-utilities";

import { getOrganizations } from "../../../src/util/common-utils";
import * as mock from "../mock/common.mock.json";
import { LogFn } from "../../../src/types";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");

describe("common utils", () => {
  const log: LogFn = () => {};
  let managementSdk: ContentstackClient;

  before(async () => {
    managementSdk = await managementSDKClient({
      host: region.cma.replace("https://", ""),
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
});
