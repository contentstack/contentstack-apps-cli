import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import {
  configHandler,
  ContentstackClient,
  ContentstackMarketplaceClient,
  managementSDKClient,
  marketplaceSDKClient,
} from "@contentstack/cli-utilities";
import { LogFn } from "../../../src/types";
import { fetchApps, getOrganizations } from "../../../src/util/common-utils";
import * as mock from "../mock/common.mock.json";
import { getDeveloperHubUrl } from "../../../src/util/inquirer";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("common utils", () => {
  let sandbox: sinon.SinonSandbox;

  const log: LogFn = () => {};
  let managementSdk: ContentstackClient;
  let marketplaceAppSdk: ContentstackMarketplaceClient;

  beforeEach(async () => {
    managementSdk = await managementSDKClient({
      host: region.cma.replace("https://", ""),
    });
    marketplaceAppSdk = await marketplaceSDKClient({
      host: developerHubBaseUrl,
    });
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("getOrganizations", () => {
    describe("Get list of organizations", () => {
      beforeEach(() => {
        nock(region.cma)
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations });
      });

      it("Returns list of organizations", async () => {
        const [org1, org2] = await getOrganizations({ log, managementSdk });
        expect(org1.uid).to.equal(mock.organizations[0].uid);
        expect(org2.uid).to.equal(mock.organizations[1].uid);
      });
    });

    describe("Get organizations with pagination", () => {
      beforeEach(() => {
        nock(region.cma)
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations, count: 110 })
          .get(
            "/v3/organizations?limit=100&asc=name&include_count=true&skip=100"
          )
          .reply(200, { organizations: mock.organizations, count: 0 });
      });

      it("Returns list of organizations with pagination", async () => {
        const organizations = await getOrganizations({ log, managementSdk });
        const [org1, org2] = organizations;
        expect(org1.uid).to.equal(mock.organizations[0].uid);
        expect(org2.uid).to.equal(mock.organizations[1].uid);
      });
    });

    describe("Get organizations failure case", () => {
      beforeEach(() => {
        nock(region.cma)
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(400);
      });

      it("API fails with status code 400", async () => {
        try {
          await getOrganizations({ log, managementSdk });
        } catch (err) {
          if (err instanceof Error) {
            const { status }: { status: number } = JSON.parse(err.message);
            expect(status).to.equal(400);
          } else {
            throw err;
          }
        }
      });
    });
  });

  describe("fetchApps", () => {
    describe("Get list of apps", () => {
      beforeEach(() => {
        nock(`https://${developerHubBaseUrl}`)
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(200, { data: mock.apps });
      });

      it("Returns list of apps", async () => {
        const [app] = await fetchApps(
          { "app-type": "stack" as any },
          "test-uid-1",
          { log, marketplaceSdk: marketplaceAppSdk }
        );
        expect(app.uid).to.equal(mock.apps[0].uid);
      });
    });

    describe("Get apps API fail case", () => {
      beforeEach(() => {
        nock(`https://${developerHubBaseUrl}`)
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(400);
      });

      it("Returns error code with 400", async () => {
        try {
          await fetchApps({ "app-type": "stack" as any }, "test-uid-1", {
            log,
            marketplaceSdk: marketplaceAppSdk,
          });
        } catch (err) {
          if (err instanceof Error) {
            expect(err.message).to.contains('"status":400');
          } else {
            throw err;
          }
        }
      });
    });
  });
});
