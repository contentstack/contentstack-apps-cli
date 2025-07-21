import { expect } from "chai";
import nock from "nock";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import sinon from "sinon";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:deploy", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub authentication
    sandbox.stub(configHandler, "get").returns({
      cma: "https://api.contentstack.io",
      cda: "https://cdn.contentstack.io",
      region: "us",
    });
    sandbox
      .stub(
        require("../../../../src/base-command").BaseCommand.prototype,
        "validateRegionAndAuth"
      )
      .callsFake(() => {});

    sandbox.stub(cliux, "loader").callsFake(() => {});
    sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
      const cases: Record<string, any> = {
        App: mock.apps[1].name,
        Organization: mock.organizations[0].name,
        "hosting types": "custom-hosting",
        appUrl: "https://example.com",
      };
      return Promise.resolve(cases[prompt.name]);
    });

    // Stub utilities used in deploy command
    sandbox
      .stub(require("../../../../src/util/common-utils"), "getProjects")
      .resolves([]);
    sandbox
      .stub(require("../../../../src/util/common-utils"), "updateApp")
      .resolves();
    sandbox
      .stub(require("../../../../src/util/common-utils"), "disconnectApp")
      .resolves();
    sandbox
      .stub(require("../../../../src/util/common-utils"), "setupConfig")
      .returns({});
    sandbox
      .stub(require("../../../../src/util/common-utils"), "formatUrl")
      .returns("https://example.com");
    sandbox
      .stub(
        require("../../../../src/util/common-utils"),
        "handleProjectNameConflict"
      )
      .resolves("test-project");

    sandbox
      .stub(require("../../../../src/util/inquirer"), "getHostingType")
      .resolves("custom-hosting");
    sandbox
      .stub(require("../../../../src/util/inquirer"), "getAppUrl")
      .resolves("https://example.com");
    sandbox
      .stub(require("../../../../src/util/inquirer"), "askProjectType")
      .resolves("existing");
    sandbox
      .stub(require("../../../../src/util/inquirer"), "askConfirmation")
      .resolves(false);
    sandbox
      .stub(require("../../../../src/util/inquirer"), "selectProject")
      .resolves(null);
    sandbox
      .stub(require("../../../../src/util/inquirer"), "askProjectName")
      .resolves("test-project");

    // Stub Launch.run
    sandbox.stub(require("@contentstack/cli-launch").Launch, "run").resolves();

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });

    nock(`https://${developerHubBaseUrl}`)
      .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
      .reply(200, { data: mock.apps2 });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Deploy an app with custom hosting", () => {
    it("should deploy the app with custom hosting", async () => {
      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps2[1].uid}`)
        .reply(200, mock.deploy_custom_host);

      const { stdout } = await runCommand(["app:deploy"], {
        root: process.cwd(),
      });
      expect(stdout).to.contain(
        $t(messages.APP_DEPLOYED, { app: mock.apps[1].name })
      );
    });
  });

  describe("Deploy an app with custom hosting using flags in command", () => {
    it("should deploy the app with custom hosting using flags in command", async () => {
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps2[1].uid}`)
        .reply(200, { data: mock.apps2[1] });

      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps2[1].uid}`)
        .reply(200, mock.deploy_custom_host);

      const { stdout } = await runCommand(
        [
          "app:deploy",
          "--org",
          mock.organizations[0].uid,
          "--app-uid",
          mock.apps[1].uid,
          "--hosting-type",
          "custom-hosting",
          "--app-url",
          "https://example.com",
        ],
        { root: process.cwd() }
      );
      expect(stdout).to.contain(
        $t(messages.APP_DEPLOYED, { app: mock.apps[1].name })
      );
    });
  });

  describe("Deploy an app with Hosting with Launch with existing project", () => {
    it("should deploy the app with Hosting with Launch with existing project", async () => {
      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps2[1].uid}`)
        .reply(200, mock.deploy_launch_host);

      const { stdout } = await runCommand(["app:deploy"], {
        root: process.cwd(),
      });
      expect(stdout).to.contain(
        $t(messages.APP_DEPLOYED, { app: mock.apps2[1].name })
      );
    });
  });
});
