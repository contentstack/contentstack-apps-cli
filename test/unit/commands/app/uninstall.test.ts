import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import * as mock from "../../mock/common.mock.json";
import { stubAuthentication } from "../../helpers/auth-stub-helper";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:uninstall", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub authentication using shared helper
    stubAuthentication(sandbox);

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
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        "wrong-uid",
      ]);
      expect(stdout).to.contain("App with id wrong-uid not installed");
    });
  });
  describe("App uninstall with invalid installation UID", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          appInstallation: "invalid-installation-uid",
        };
        return cases[prompt.name];
      });

      nock(`https://${developerHubBaseUrl}`)
        .delete("/installations/invalid-installation-uid")
        .reply(404, {
          error: "Not Found",
          message: "Installation not found",
        });
    });

    it("should fail when installation UID is invalid", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        "invalid-installation-uid",
      ]);
      expect(stdout).to.contain("Installation not found");
    });
  });
  describe("App uninstall with permission denied", () => {
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
        .reply(403, {
          error: "Forbidden",
          message: "You don't have permission to uninstall this app",
        });
    });

    it("should fail when user lacks permission", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        mock.installations[0].uid,
      ]);
      expect(stdout).to.contain("You don't have permission");
    });
  });

  describe("App uninstall with organization UID instead of app UID", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          appInstallation: mock.installations[0].uid,
        };
        return cases[prompt.name];
      });

      // Mock the uninstall API to return error when organization UID is used instead of app UID
      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/${mock.installations[0].uid}`)
        .reply(400, {
          error: "Bad Request",
          message:
            "Organization UID provided instead of app UID. Cannot uninstall from organization.",
        });
    });

    it("should fail when organization UID is used instead of app UID", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--installation-uid",
        mock.installations[0].uid,
      ]);

      // Should fail because organization UID is being used where app UID is expected
      expect(stdout).to.contain("Organization UID provided instead of app UID");
    });
  });

  describe("Uninstall all apps using --uninstall-all flag", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });

      // Mock the organizations API call (for getOrg)
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      // Mock the app fetch API call (using manifests endpoint like existing tests)
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}`)
        .reply(200, { data: mock.apps[0] });

      // Mock the installations API call (same as existing tests)
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}/installations`)
        .reply(200, { data: mock.installations });

      // Mock the stacks API call (for getStacks in getInstallation)
      nock(region.cma)
        .get(
          `/v3/organizations/${mock.organizations[0].uid}/stacks?include_count=true&limit=100&asc=name&skip=0`
        )
        .reply(200, { items: mock.stacks });

      // Mock the uninstall API for multiple installations
      mock.installations.forEach((installation: any) => {
        nock(`https://${developerHubBaseUrl}`)
          .delete(`/installations/${installation.uid}`)
          .reply(200, { data: {} });
      });
    });

    it("should successfully uninstall all apps using uninstall-all strategy", async () => {
      const { stdout } = await runCommand([
        "app:uninstall",
        "--app-uid",
        mock.apps[0].uid,
        "--uninstall-all",
      ]);

      expect(stdout).to.contain(
        $t(messages.APP_UNINSTALLED, { app: mock.apps[0].name })
      );
    });

    it("should handle uninstall-all with organization app", async () => {
      // Mock the organizations API call (for getOrg)
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      // Mock the app fetch API call for organization app (using manifests endpoint)
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[1].uid}`)
        .reply(200, { data: mock.apps[1] });

      // Mock the installations API call for organization app
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[1].uid}/installations`)
        .reply(200, { data: [mock.installations[1]] });

      const { stdout } = await runCommand([
        "app:uninstall",
        "--app-uid",
        mock.apps[1].uid,
        "--uninstall-all",
      ]);

      expect(stdout).to.contain(
        $t(messages.APP_UNINSTALLED, { app: mock.apps[1].name })
      );
    });
  });

  describe("Uninstall all apps error handling", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
    });

    it("should handle partial uninstall failures in uninstall-all", async () => {
      // Mock the organizations API call (for getOrg)
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      // Mock the app fetch API call (using manifests endpoint)
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}`)
        .reply(200, { data: mock.apps[0] });

      // Mock the installations API to return multiple installation UIDs
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}/installations`)
        .reply(200, { data: mock.installations });

      // Mock the stacks API call (for getStacks in getInstallation)
      nock(region.cma)
        .get(
          `/v3/organizations/${mock.organizations[0].uid}/stacks?include_count=true&limit=100&asc=name&skip=0`
        )
        .reply(200, { items: mock.stacks });

      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/${mock.installations[0].uid}`)
        .reply(200, { data: {} });

      nock(`https://${developerHubBaseUrl}`)
        .delete(`/installations/${mock.installations[1].uid}`)
        .reply(500, {
          error: "Internal Server Error",
          message: "Failed to uninstall app",
        });

      const { stdout } = await runCommand([
        "app:uninstall",
        "--app-uid",
        mock.apps[0].uid,
        "--uninstall-all",
      ]);

      expect(stdout).to.contain("Failed to uninstall app");
    });
  });
});
