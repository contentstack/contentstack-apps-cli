import { expect } from "chai";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import sinon from "sinon";
import fancy from "fancy-test";
import * as mock from "../../mock/common.mock.json";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string; cda: string; name: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:reinstall", () => {
  let inquireStub: sinon.SinonStub;

  beforeEach(() => {
    inquireStub = sinon
      .stub(cliux, "inquire")
      .callsFake(async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          Stack: mock.stacks[0].name,
        };
        return (cases as Record<string, any>)[prompt.name];
      });
  });

  afterEach(() => {
    inquireStub.restore();
  });

  describe("Reinstall an app on a stack", () => {
    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(region.cma, (api) =>
        api
          .get(
            `/v3/organizations/${mock.organizations[0].uid}/stacks?limit=100&asc=name&include_count=true&skip=0`
          )
          .reply(200, { stacks: mock.stacks })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get(`/manifests?limit=50&asc=name&include_count=true&skip=0`)
          .reply(200, { data: mock.apps })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
            target_type: mock.apps[0].target_type,
            target_uid: mock.stacks[0].api_key,
          })
          .reply(200, { data: mock.apps })
      )
      .it("should reinstall a stack app", async () => {
        const { stdout } = await runCommand(["app:reinstall"]);
        expect(stdout).to.contain(
          $t(messages.APP_REINSTALLED_SUCCESSFULLY, {
            app: mock.apps[0].name,
            target: mock.stacks[0].name,
          })
        );
      });
  });

  describe("Show error when stack is not selected", () => {
    beforeEach(() => {
      inquireStub.callsFake(async (prompt: any) => {
        const cases = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          Stack: mock.stacks[0].name,
        };
        return (cases as Record<string, any>)[prompt.name];
      });
    });

    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(region.cma, (api) =>
        api
          .get(`/v3/organizations/${mock.organizations[0].uid}/stacks?limit=100&asc=name&include_count=true&skip=0`)
          .reply(200, { stacks: mock.stacks })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, { data: mock.apps })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
            target_type: mock.apps[0].target_type,
            target_uid: mock.stacks[0].api_key, // This must match the actual request
          })
          .reply(200, { data: mock.apps })
      )
      .it("should display an error message when trying to reinstall a stack app without selecting a stack", async () => {
        inquireStub.callsFake(async (prompt: any) => {
          const cases = {
            App: mock.apps[0].name,
            Organization: mock.organizations[0].name,
            Stack: mock.stacks[0].name,
          };
          return (cases as Record<string, any>)[prompt.name];
        });

        const { stdout } = await runCommand(["app:reinstall"]);
        expect(stdout).to.contain('warn: As App 1 is a stack app, it can only be reinstalled in a stack. Please select a stack.\ninfo: Reinstalling App 1 on stack stack_api_key_1.\ninfo: App 1 reinstalled successfully in Stack 1.\ninfo: Please use the following URL to start using the stack: https://app.contentstack.com/#!/stack/stack_api_key_1/dashboard\n');
      });
  });

  describe("Reinstall an app on organization", () => {
    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, { data: mock.apps })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .put(`/manifests/${mock.apps[1].uid}/reinstall`, {
            target_type: mock.apps[1].target_type,
            target_uid: mock.organizations[0].uid,
          })
          .reply(200, { data: mock.apps })
      )
      .it("should reinstall an organization app", async () => {
        inquireStub.callsFake(async (prompt: any) => {
          const cases = {
            App: mock.apps[1].name,
            Organization: mock.organizations[0].name,
          };
          return (cases as Record<string, any>)[prompt.name];
        });

        const { stdout } = await runCommand(["app:reinstall"]);
        expect(stdout).to.contain(
          $t(messages.REINSTALLING_APP_NOTICE, {
            app: mock.apps[1].name,
            type: mock.apps[1].target_type,
            target: mock.organizations[0].uid,
          })
        );
      });
  });

  describe("Stack API Key and App ID provided through flags", () => {
    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(region.cma, (api) =>
        api.get(`/v3/stacks`).reply(200, { stack: mock.stacks[0] })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get(`/manifests/${mock.apps[0].uid}`)
          .reply(200, { data: mock.apps[0] })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
            target_type: mock.apps[0].target_type,
            target_uid: mock.stacks[0].api_key,
          })
          .reply(200, { data: mock.apps })
      )
      .it("should reinstall a stack app", async () => {
        const { stdout } = await runCommand([
          "app:reinstall",
          "--stack-api-key",
          mock.stacks[0].api_key,
          "--app-uid",
          mock.apps[0].uid,
        ]);
        expect(stdout).to.contain(
          $t(messages.APP_REINSTALLED_SUCCESSFULLY, {
            app: mock.apps[0].name,
            target: mock.stacks[0].name,
          })
        );
      });
  });

  describe("App is already latest version", () => {
    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get(`/manifests/${mock.apps[1].uid}`).reply(200, {
          data: mock.apps[1],
        })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .put(`/manifests/${mock.apps[1].uid}/reinstall`, {
            target_type: mock.apps[1].target_type,
            target_uid: mock.organizations[0].uid,
          })
          .reply(400, {
            message: "You are already using the latest version.",
            error: "Bad Request",
          })
      )
      .it("should fail with an error that already using the latest version.", async () => {
        const { stdout } = await runCommand([
          "app:reinstall",
          "--app-uid",
          mock.apps[1].uid,
        ]);
        
        expect(stdout).to.contain(
          'info: Reinstalling App 2 on organization test-uid-1.\nerror: You are already using the latest version.\n'
        );
      });
  });
});
