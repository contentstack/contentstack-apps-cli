import { ux, cliux, configHandler } from "@contentstack/cli-utilities";
import { expect, test } from "@oclif/test";

import * as mock from "../../mock/common.mock.json";

import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string; cda: string; name: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:deploy", () => {
  describe("Deploy an with custom hosting", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .post(`/manifests/${mock.apps[1].uid}/deployments`, {
            hosting_type: "Custom hosting",
          })
          .reply(200, {
            data: mock.apps,
          })
      )
      .command(["app:deploy"])
      .do(({ stdout }) => {
        expect(stdout).to.contain(
          $t(messages.HOSTING_TYPE, {
            hosting_type: "Custom Hosting",
            deployment_url: "https://example.com"
          })
        );
      })
      .it("should install an organization app");
  });
});
