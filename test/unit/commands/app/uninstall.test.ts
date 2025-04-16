import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, ux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import * as mock from "../../mock/common.mock.json";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:uninstall", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(cliux, "loader").callsFake(() => {});
    sandbox.stub(cliux, "loader").callsFake(() => {});

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });

    nock(`https://${developerHubBaseUrl}`)
      .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
      .reply(200, { data: mock.apps });

    nock(`https://${developerHubBaseUrl}`)
      .get(`/manifests/${mock.apps[0].uid}/installations`)
      .reply(200, { data: mock.installations });

    nock(`https://${developerHubBaseUrl}`)
      .get(`/manifests/${mock.apps[1].uid}/installations`)
      .reply(200, { data: mock.installations });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Uninstall an app from organization", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/${mock.installations[1].uid}`)
        .reply(200, { data: {} });
    });
    it("should uninstall an organization app", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        mock.installations[1].uid,
      ]);
      expect(stdout).to.contain(
        $t(messages.APP_UNINSTALLED, { app: mock.apps[1].name })
      );
    });
  });

  describe("Uninstall an app from a stack", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          appInstallation: mock.installations[0].uid,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/${mock.installations[0].uid}`)
        .reply(200, { data: {} });
    });

    it("should uninstall a stack app", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        mock.installations[0].uid,
      ]);
      expect(stdout).to.contain(
        $t(messages.APP_UNINSTALLED, { app: mock.apps[0].name })
      );
    });
  });

  describe("Fail to uninstall an app from a stack", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          appInstallation: mock.installations[0].uid,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/wrong-uid`)
        .reply(404, {
          error: "Not Found",
          message: "App with id wrong-uid not installed",
        });
    });

    it("should fail with an error", async () => {
      const { stdout, error } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        "wrong-uid",
      ]);
      expect(stdout).to.contain("App with id wrong-uid not installed");
      expect(error?.oclif?.exit).to.equal(1);
    });
  });
});
