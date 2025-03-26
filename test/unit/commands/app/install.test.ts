import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import axios from "axios";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:install", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axios.defaults.adapter = "http";

    sandbox.stub(cliux, "loader").callsFake(() => {});
    sandbox.stub(cliux, "loader").callsFake(() => {});

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });

    nock(`https://${developerHubBaseUrl}`)
      .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
      .reply(200, { data: mock.apps });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Install an app on organization", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .post(`/manifests/${mock.apps[1].uid}/install`, {
          target_type: mock.apps[1].target_type,
          target_uid: mock.organizations[0].uid,
        })
        .reply(200, { data: mock.apps });
    });

    it("should install an organization app", async () => {
      const { stdout } = await runCommand(["app:install"]);
      expect(stdout).to.contain(
        messages.INSTALLING_APP_NOTICE.replace("{app}", mock.apps[1].name)
          .replace("{type}", mock.apps[1].target_type)
          .replace("{target}", mock.organizations[0].uid)
      );
    });
  });

  describe("Install an app on a stack", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          Stack: mock.stacks[0].name,
        };
        return cases[prompt.name];
      });
      nock(region.cma)
        .get(
          `/v3/organizations/${mock.organizations[0].uid}/stacks?limit=100&asc=name&include_count=true&skip=0`
        )
        .reply(200, { stacks: mock.stacks });

      nock(`https://${developerHubBaseUrl}`)
        .post(`/manifests/${mock.apps[0].uid}/install`, {
          target_type: mock.apps[0].target_type,
          target_uid: mock.stacks[0].api_key,
        })
        .reply(200, { data: mock.apps });
    });

    it("should install a stack app", async () => {
      const { stdout } = await runCommand(["app:install"]);
      expect(stdout).to.contain(
        messages.APP_INSTALLED_SUCCESSFULLY.replace(
          "{app}",
          mock.apps[0].name
        ).replace("{target}", mock.stacks[0].name)
      );
    });
  });

  describe("Stack API Key and App ID provided through flags", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
      nock(region.cma).get(`/v3/stacks`).reply(200, { stack: mock.stacks[0] });
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}`)
        .reply(200, {
          data: mock.apps[0],
        });
      nock(`https://${developerHubBaseUrl}`)
        .post(`/manifests/${mock.apps[0].uid}/install`, {
          target_type: mock.apps[0].target_type,
          target_uid: mock.stacks[0].api_key,
        })
        .reply(200, { data: mock.apps });
    });

    it("should install a stack app", async () => {
      const { stdout } = await runCommand([
        "app:install",
        "--stack-api-key",
        mock.stacks[0].api_key,
        "--app-uid",
        mock.apps[0].uid,
      ]);
      expect(stdout).to.contain(
        messages.APP_INSTALLED_SUCCESSFULLY.replace(
          "{app}",
          mock.apps[0].name
        ).replace("{target}", mock.stacks[0].name)
      );
    });
  });

  describe("App is already installed", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .post(`/manifests/${mock.apps[1].uid}/install`, {
          target_type: mock.apps[1].target_type,
          target_uid: mock.organizations[0].uid,
        })
        .reply(400, {
          message: "Installation for app is already done",
        });
    });

    it("should fail with an error that app is already installed", async () => {
      const { stdout } = await runCommand(["app:install"]);
      expect(stdout).to.contain("Installation for app is already done");
    });
  });
});
