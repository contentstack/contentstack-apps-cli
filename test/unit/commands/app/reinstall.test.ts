import { expect } from "chai";
import nock from "nock";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, ux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import axios from "axios";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:reinstall", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axios.defaults.adapter = "http";

    sandbox.stub(ux.action, "stop").callsFake(() => {});
    sandbox.stub(ux.action, "start").callsFake(() => {});

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Reinstall an app on organization", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });
      sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
        const cases: Record<string, any> = {
          App: mock.apps[1].name,
          Organization: mock.organizations[0].name,
        };
        return cases[prompt.name];
      });
      nock(`https://${developerHubBaseUrl}`)
        .post(`/manifests/${mock.apps[1].uid}/reinstall`, {
          target_type: mock.apps[1].target_type,
          target_uid: mock.organizations[0].uid,
        })
        .reply(200, { data: mock.apps });
    });

    it("should reinstall an organization app", async () => {
      const { stdout } = await runCommand(["app:reinstall"]);
      expect(stdout).to.contain(
        messages.REINSTALLING_APP_NOTICE.replace("{app}", mock.apps[1].name)
          .replace("{type}", mock.apps[1].target_type)
          .replace("{target}", mock.organizations[0].uid)
      );
    });
  });

  describe("Reinstall an app on a stack", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });
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
        .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
          target_type: mock.apps[0].target_type,
          target_uid: mock.stacks[0].api_key,
        })
        .reply(200, { data: mock.apps });
    });

    it("should reinstall a stack app", async () => {
      const { stdout } = await runCommand(["app:reinstall"]);
      expect(stdout).to.contain(
        messages.APP_REINSTALLED_SUCCESSFULLY.replace(
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
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });
      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[0].uid}`)
        .reply(200, {
          data: mock.apps[0],
        });
      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
          target_type: mock.apps[0].target_type,
          target_uid: mock.stacks[0].api_key,
        })
        .reply(200, { data: mock.apps });
    });

    it("should reinstall a stack app", async () => {
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

  describe("Show error when stack is not selected", () => {
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
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(region.cma)
        .get(
          `/v3/organizations/${mock.organizations[0].uid}/stacks?limit=100&asc=name&include_count=true&skip=0`
        )
        .reply(200, { stacks: mock.stacks });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });
      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps[0].uid}/reinstall`, {
          target_type: mock.apps[0].target_type,
          target_uid: mock.stacks[0].api_key,
        })
        .reply(200, { data: mock.apps });
    });
    it("should display an error message when trying to reinstall a stack app without selecting a stack", async () => {
      const { stdout } = await runCommand(["app:reinstall"]);
      expect(stdout).to.contain(
        "warn: As App 1 is a stack app, it can only be reinstalled in a stack. Please select a stack.\ninfo: Reinstalling App 1 on stack stack_api_key_1.\ninfo: App 1 reinstalled successfully in Stack 1.\ninfo: Please use the following URL to start using the stack: https://app.contentstack.com/#!/stack/stack_api_key_1/dashboard\n"
      );
    });
  });

  describe("App is already latest version", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").callsFake(async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: mock.apps[0].name,
          Organization: mock.organizations[0].name,
          Stack: mock.stacks[0].name,
        };
        return (cases as Record<string, any>)[prompt.name];
      });
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get(`/manifests/${mock.apps[1].uid}`)
        .reply(200, {
          data: mock.apps[1],
        });

      nock(`https://${developerHubBaseUrl}`)
        .put(`/manifests/${mock.apps[1].uid}/reinstall`, {
          target_type: mock.apps[1].target_type,
          target_uid: mock.organizations[0].uid,
        })
        .reply(400, {
          message: "You are already using the latest version.",
          error: "Bad Request",
        });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it("should fail with an error that already using the latest version", async () => {
      const { stdout } = await runCommand([
        "app:reinstall",
        "--app-uid",
        mock.apps[1].uid,
      ]);

      expect(stdout).to.contain(
        "info: Reinstalling App 2 on organization test-uid-1.\nerror: You are already using the latest version.\n"
      );
    });
  });
});
