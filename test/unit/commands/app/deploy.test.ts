import { ux, cliux, configHandler } from "@contentstack/cli-utilities";
import { expect, test } from "@oclif/test";

import * as mock from "../../mock/common.mock.json";

import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string; cda: string; name: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:deploy", () => {
  describe("Deploy an app with custom hosting", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
          "hosting types": "Custom Hosting",
          appUrl: "https://example.com",
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
            data: mock.apps2,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put(`/manifests/${mock.apps2[1].uid}`).reply(200, mock.deploy_custom_host)
      )
      .command(["app:deploy"])
      .do(({ stdout }) => {
        expect(stdout).to.contain(
          $t(messages.APP_DEPLOYED, { app: mock.apps[1].name })
        );
      })
      .it("should deploy the app with custom hosting");
  });

  describe("Deploy an app with Hosting with Launch with existing project", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: mock.apps2[1].name,
          Organization: mock.organizations[0].name,
          "hosting types": "Hosting with Launch",
          "provider": "launch",
          "selected_launch_project":"existing",
          "deployment_url": "https://example.com",
          "environment_uid": "environment_uid",
          "project_uid": "project_uid",
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
            data: mock.apps2,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put(`/manifests/${mock.apps2[1].uid}`).reply(200, mock.deploy_launch_host)
      )
      .command(["app:deploy"])
      .do(({ stdout }) => {
        expect(stdout).to.contain(
          $t(messages.APP_DEPLOYED, { app: mock.apps2[1].name })
        );
      })
      .it("should deploy the app with Hosting with Launch with existing project");
  });
});
