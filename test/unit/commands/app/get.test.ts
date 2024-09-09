import { expect } from 'chai';
import { join } from "path";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import fancy from 'fancy-test';
import sinon from 'sinon';
import config from "../../../../src/config";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../config/manifest.json";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string; name: string; cda: string } = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:get", () => {
  let inquireStub: sinon.SinonStub;
  let confirmStub: sinon.SinonStub;

  beforeEach(() => {
    inquireStub = sinon.stub(cliux, "inquire").callsFake(async (...args: any) => {
      const [prompt]: any = args;
      const cases = {
        App: "App 1",
        Organization: "test org 1",
      };
      return (cases as Record<string, any>)[prompt.name];
    });

    confirmStub = sinon.stub(cliux, "confirm");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Get app manifest", () => {
    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(200, { data: mock.apps })
      )
      .it("should return manifest for selected app", async () => {
        const { stdout } = await runCommand([
            "app:get",
            "--data-dir",
            join(process.cwd(), "test", "unit")
        ], { root: process.cwd() });
        expect(stdout).to.contain($t(messages.FILE_WRITTEN_SUCCESS_INFO, {
            file: join(process.cwd(), "test", "unit", `manifest10.json`)
        }));
      });
  });

  describe("Get app manifest with app uid", () => {
    beforeEach(() => {
      inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves("test org 1");
    });

    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .it("should return manifest for specific uid passed", async () => {
        const { stdout } = await runCommand([
          "app:get",
          "--data-dir",
          join(process.cwd(), "test", "unit"),
          "--app-uid",
          "app-uid-1"
        ], { root: process.cwd() });
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS_INFO, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              `manifest10.json`
            ),
          })
        );
      });
  });

  describe("Ask confirmation if `manifest.json` exists and go with `Yes` option", () => {
    beforeEach(() => {
      inquireStub.withArgs(sinon.match.has("name", "App")).resolves("App 1");
      inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves("test org 1");
      confirmStub.resolves(false);
    });

    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(200, { data: mock.apps })
      )
      .it("Should create config file with the +1 mechanism", async () => {
        const { stdout } = await runCommand([
          "app:get",
          "--data-dir",
          join(process.cwd(), "test", "unit", "config"),
        ], { root: process.cwd() });
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              "config",
              `${config.defaultAppFileName}1.json`
            ),
          })
        );
      });
  });

  describe("Ask confirmation if `manifest.json` exists and go with `No` option", () => {
    beforeEach(() => {
      inquireStub.withArgs(sinon.match.has("name", "App")).resolves("App 1");
      inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves("test org 1");
      confirmStub.resolves(true);
    });

    fancy
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(200, { data: mock.apps })
      )
      .it("Should overwrite config file", async () => {
        const { stdout } = await runCommand([
          "app:get",
          "--data-dir",
          join(process.cwd(), "test", "unit", "config"),
        ], { root: process.cwd() });
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              "config",
              `${config.defaultAppFileName}.json`
            ),
          })
        );
      });
  });

  describe("Pass wrong org uid through flag", () => {
    fancy
      .it('should exit with code 101', async () => {
        const {stdout} = await runCommand<{name: string}>(["app:get", "--org", "test-uid-1"])
        expect(stdout).to.contain(messages.ORG_UID_NOT_FOUND)
      })
  });
});
