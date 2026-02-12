import { expect } from "chai";
import nock from "nock";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
const mock = (global as any).commonMock;
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import sinon from "sinon";
import { stubAuthentication } from "../../helpers/auth-stub-helper";
import Deploy from "../../../../src/commands/app/deploy";
import { BaseCommand } from "../../../../src/base-command";
import { join } from "path";

const region = configHandler.get("region");
// Commands run from lib/ (oclif.commands); stub the same classes/modules the running command uses
let BaseCommandToStub: typeof BaseCommand;
let LibDeploy: typeof Deploy;
let libCommonUtils: any;
let libInquirer: any;
try {
  BaseCommandToStub = require(join(process.cwd(), "lib", "base-command")).BaseCommand;
} catch {
  BaseCommandToStub = BaseCommand;
}
try {
  LibDeploy = require(join(process.cwd(), "lib", "commands", "app", "deploy")).default;
} catch {
  LibDeploy = Deploy;
}
try {
  libCommonUtils = require(join(process.cwd(), "lib", "util", "common-utils"));
} catch {
  libCommonUtils = require("../../../../src/util/common-utils");
}
try {
  libInquirer = require(join(process.cwd(), "lib", "util", "inquirer"));
} catch {
  libInquirer = require("../../../../src/util/inquirer");
}
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:deploy", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Prevent deploy command's process.exit(1) from killing the test runner
    sandbox.stub(process, "exit").callsFake(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as any);

    // Stub authentication using shared helper
    stubAuthentication(sandbox);

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

    // Stub utilities used by the running command (lib/util); stub same module it requires
    sandbox.stub(libCommonUtils, "getProjects").resolves([]);
    sandbox.stub(libCommonUtils, "updateApp").resolves();
    sandbox.stub(libCommonUtils, "disconnectApp").resolves();
    sandbox.stub(libCommonUtils, "setupConfig").returns({});
    sandbox.stub(libCommonUtils, "formatUrl").returns("https://example.com");
    sandbox.stub(libCommonUtils, "handleProjectNameConflict").resolves("test-project");

    sandbox.stub(libInquirer, "getHostingType").resolves("custom-hosting");
    sandbox.stub(libInquirer, "getAppUrl").resolves("https://example.com");
    sandbox.stub(libInquirer, "askProjectType").resolves("existing");
    sandbox.stub(libInquirer, "askConfirmation").resolves(false);
    sandbox.stub(libInquirer, "selectProject").resolves(null);
    sandbox.stub(libInquirer, "askProjectName").resolves("test-project");

    // Stub Launch.run
    sandbox.stub(require("@contentstack/cli-launch").Launch, "run").resolves();

    // Stub getApolloClient on the class that actually runs (lib Deploy) so no real GraphQL runs
    sandbox.stub(LibDeploy.prototype, "getApolloClient").resolves({
      query: () =>
        Promise.resolve({
          data: {
            projects: {
              edges: [],
            },
          },
        }),
    } as any);

    // Stub SDK init so no real HTTP is made (cli-utilities exports use getters so we can't stub those).
    const mockManagementSdk = {
      organization: () => ({
        fetchAll: () =>
          Promise.resolve({
            items: mock.organizations,
            count: mock.organizations.length,
          }),
      }),
    };
    const mockMarketplaceSdk = {
      marketplace: () => ({
        findAllApps: () =>
          Promise.resolve({ items: mock.apps2, count: mock.apps2.length }),
        app: (uid: string) => ({
          fetch: () =>
            Promise.resolve(
              mock.apps2.find((a: any) => a.uid === uid) || mock.apps2[1]
            ),
        }),
      }),
    };
    sandbox.stub(BaseCommandToStub.prototype, "initCmaSDK").callsFake(async function (this: any) {
      this.managementSdk = mockManagementSdk;
      this.managementAppSdk = mockManagementSdk;
    });
    sandbox.stub(BaseCommandToStub.prototype, "initMarketplaceSDK").callsFake(async function (this: any) {
      this.marketplaceAppSdk = mockMarketplaceSdk;
    });

    // Nock CMA and developer hub (SDK may use :443 or different param order)
    const cmaOrigin = region.cma.replace(/\/$/, "");
    const orgReply = {
      organizations: mock.organizations,
      count: mock.organizations.length,
    };
    nock(cmaOrigin).get("/v3/organizations").query(true).reply(200, orgReply);
    nock("https://api.contentstack.io:443")
      .get("/v3/organizations")
      .query(true)
      .reply(200, orgReply);
    nock(`https://${developerHubBaseUrl}`)
      .get("/manifests")
      .query(true)
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

  describe("Deploy app error handling", () => {
    it("should fail with invalid hosting type", async () => {
      sandbox.restore();
      sandbox = sinon.createSandbox();
      sandbox.stub(process, "exit").callsFake(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as any);
      sandbox.stub(LibDeploy.prototype, "getApolloClient").resolves({
        query: () =>
          Promise.resolve({
            data: { projects: { edges: [] } },
          }),
      } as any);
      const mockMgmt = {
        organization: () => ({
          fetchAll: () =>
            Promise.resolve({
              items: mock.organizations,
              count: mock.organizations.length,
            }),
        }),
      };
      const mockMkt = {
        marketplace: () => ({
          findAllApps: () =>
            Promise.resolve({ items: mock.apps2, count: mock.apps2.length }),
          app: (uid: string) => ({
            fetch: () =>
              Promise.resolve(
                mock.apps2.find((a: any) => a.uid === uid) || mock.apps2[1]
              ),
          }),
        }),
      };
      sandbox.stub(BaseCommandToStub.prototype, "initCmaSDK").callsFake(async function (this: any) {
        this.managementSdk = mockMgmt;
        this.managementAppSdk = mockMgmt;
      });
      sandbox.stub(BaseCommandToStub.prototype, "initMarketplaceSDK").callsFake(async function (this: any) {
        this.marketplaceAppSdk = mockMkt;
      });
      stubAuthentication(sandbox);

      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
          "hosting types": "invalid-hosting",
        };
        return Promise.resolve(cases[prompt.name]);
      });

      sandbox.stub(libCommonUtils, "getProjects").resolves([]);
      sandbox.stub(libCommonUtils, "updateApp").resolves();

      nock(region.cma)
        .get("/v3/organizations")
        .query(true)
        .reply(200, {
          organizations: mock.organizations,
          count: mock.organizations.length,
        });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests")
        .query(true)
        .reply(200, { data: mock.apps2 });

      const { stdout } = await runCommand(["app:deploy"], {
        root: process.cwd(),
      });
      expect(stdout).to.contain("Provide a valid hosting type.");
    });

    it("should handle new project creation with hosting-with-launch", async () => {
      sandbox.restore();
      sandbox = sinon.createSandbox();
      sandbox.stub(process, "exit").callsFake(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as any);
      sandbox.stub(LibDeploy.prototype, "getApolloClient").resolves({
        query: () =>
          Promise.resolve({
            data: {
              projects: {
                edges: [
                  {
                    node: {
                      name: "new-project",
                      uid: "project-2",
                      latestDeploymentStatus: {
                        deployment: { url: "https://new-project.com" },
                        environment: { uid: "env-2" },
                      },
                      integrations: { developerHubApp: { uid: null } },
                    },
                  },
                ],
              },
            },
          }),
      } as any);
      const mockMgmt = {
        organization: () => ({
          fetchAll: () =>
            Promise.resolve({
              items: mock.organizations,
              count: mock.organizations.length,
            }),
        }),
      };
      const mockMkt = {
        marketplace: () => ({
          findAllApps: () =>
            Promise.resolve({ items: mock.apps2, count: mock.apps2.length }),
          app: (uid: string) => ({
            fetch: () =>
              Promise.resolve(
                mock.apps2.find((a: any) => a.uid === uid) || mock.apps2[1]
              ),
          }),
        }),
      };
      sandbox.stub(BaseCommandToStub.prototype, "initCmaSDK").callsFake(async function (this: any) {
        this.managementSdk = mockMgmt;
        this.managementAppSdk = mockMgmt;
      });
      sandbox.stub(BaseCommandToStub.prototype, "initMarketplaceSDK").callsFake(async function (this: any) {
        this.marketplaceAppSdk = mockMkt;
      });
      stubAuthentication(sandbox);

      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
          "hosting types": "hosting-with-launch",
          "launch project": "new",
        };
        return Promise.resolve(cases[prompt.name]);
      });

      // Re-stub lib util used by deploy (restore() removed beforeEach stubs)
      sandbox.stub(libInquirer, "getHostingType").resolves("hosting-with-launch");
      sandbox.stub(libInquirer, "askProjectType").resolves("new");
      sandbox.stub(libInquirer, "askProjectName").resolves("new-project");
      sandbox.stub(libInquirer, "askConfirmation").resolves(false);
      sandbox.stub(libInquirer, "selectProject").resolves(null);

      sandbox.stub(libCommonUtils, "getProjects").resolves([
        {
          name: "new-project",
          uid: "project-2",
          url: "https://new-project.com",
          environmentUid: "env-2",
        },
      ]);
      sandbox.stub(libCommonUtils, "setupConfig").returns({
        name: "new-project",
        type: "react",
        environment: "production",
        framework: "nextjs",
      });
      sandbox.stub(libCommonUtils, "handleProjectNameConflict").resolves("new-project");
      sandbox.stub(libCommonUtils, "updateApp").resolves();
      sandbox
        .stub(require("@contentstack/cli-launch").Launch, "run")
        .resolves();

      nock(region.cma)
        .get("/v3/organizations")
        .query(true)
        .reply(200, {
          organizations: mock.organizations,
          count: mock.organizations.length,
        });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests")
        .query(true)
        .reply(200, { data: mock.apps2 });

      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps2[1].uid}`)
        .reply(200, mock.deploy_launch_host);

      const { stdout } = await runCommand(["app:deploy"], {
        root: process.cwd(),
      });
      expect(stdout).to.contain(
        $t(messages.APP_DEPLOYED, { app: mock.apps[1].name })
      );
    });
  });
});
