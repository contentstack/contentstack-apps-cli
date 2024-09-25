import { expect } from "chai";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import sinon from "sinon";
import * as mock from "../../mock/common.mock.json";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import nock from "nock";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:delete", () => {
  describe("app:delete with --org and --app-uid flags", () => {
    it("should print an error saying that app is already installed", async () => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1/installations")
        .reply(200, {
          data: mock.installations,
        });

      const { stdout } = await runCommand([
        "app:delete",
        "--org",
        mock.organizations[0].uid,
        "--app-uid",
        mock.apps[0].uid,
      ]);

      expect(stdout).to.contain(messages.APP_IS_INSTALLED);
      nock.cleanAll();
    });
  });

  describe("app:delete using inquirer prompts", () => {
    it("should delete the app", async () => {
      const inquireStub = sinon
        .stub(cliux, "inquire")
        .callsFake(async (prompt: any) => {
          const cases: Record<string, any> = {
            Organization: "test org 1",
            App: "App 1",
            confirmation: true,
          };
          return Promise.resolve(cases[prompt.name]);
        });

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1/installations")
        .reply(200, { data: [] });

      nock(`https://${developerHubBaseUrl}`)
        .delete("/manifests/app-uid-1")
        .reply(200, { data: {} });

      const { stdout } = await runCommand(["app:delete"]);

      expect(stdout).to.contain(
        $t(messages.APP_DELETED_SUCCESSFULLY, { app: mock.apps[0].name })
      );

      inquireStub.restore();
      nock.cleanAll();
    });
  });

  describe("app:delete error handling", () => {
    afterEach(() => {
      sinon.restore();
      nock.cleanAll();
    });
    it("should handle error with status 409 and statusText 'Conflict'", async () => {
      const inquireStub = sinon
        .stub(cliux, "inquire")
        .callsFake(async (prompt: any) => {
          const cases: Record<string, any> = {
            Organization: "test org 1",
            App: "App 1",
            confirmation: true,
          };
          return Promise.resolve(cases[prompt.name]);
        });

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1/installations")
        .replyWithError({
          status: 409,
          message: "(1) installations found for this app",
          error: "Bad Request",
          statusText: "Conflict",
        });
      const { stderr } = await runCommand(["app:delete"]);
      expect(stderr).to.contain(messages.CONTACT_SUPPORT);
      inquireStub.restore();
      nock.cleanAll();
    });
  });
});
