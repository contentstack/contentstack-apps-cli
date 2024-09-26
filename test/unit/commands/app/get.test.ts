import { expect } from "chai";
import nock from "nock";
import fs from "fs";
import { join } from "path";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages, { $t } from "../../../../src/messages";
import * as commonUtils from "../../../../src/util/common-utils";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../../../src/config/manifest.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import config from "../../../../src/config";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:get", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(fs, "readdirSync").callsFake(() => []);
    sandbox.stub(fs, "writeFileSync").callsFake(() => {});
    sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
      const cases: Record<string, any> = {
        App: "App 1",
        Organization: "test org 1",
      };
      return Promise.resolve(cases[prompt.name]);
    });

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });

    nock(`https://${developerHubBaseUrl}`)
      .get(
        "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
      )
      .reply(200, { data: mock.apps });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Get app manifest", () => {
    it("should return manifest for selected app", async () => {
      const { stdout } = await runCommand([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit"),
      ]);
      expect(stdout).to.contain(
        $t(messages.FILE_WRITTEN_SUCCESS, {
          file: join(
            process.cwd(),
            "test",
            "unit",
            `${config.defaultAppFileName}.json`
          ),
        })
      );
    });
  });

  describe("Get app manifest with app uid", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        });
    });

    it("should return manifest for specific uid passed", async () => {
      const { stdout } = await runCommand([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit"),
        "--app-uid",
        "app-uid-1",
      ]);
      expect(stdout).to.contain(
        $t(messages.FILE_WRITTEN_SUCCESS, {
          file: join(
            process.cwd(),
            "test",
            "unit",
            `${config.defaultAppFileName}.json`
          ),
        })
      );
    });
  });

  describe("Handle existing manifest.json", () => {
    describe("Confirm overwrite", () => {
      it("should create config file with the +1 mechanism", async () => {
        sandbox.stub(cliux, "confirm").callsFake(async () => false);
        const { stdout } = await runCommand([
          "app:get",
          "--data-dir",
          join(process.cwd(), "test", "unit", "config"),
        ]);
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

      it("should overwrite config file2", async () => {
        sandbox.stub(cliux, "confirm").callsFake(async () => true);
        const { stdout } = await runCommand([
          "app:get",
          "--data-dir",
          join(process.cwd(), "test", "unit", "config"),
        ]);
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              "config",
              "manifest.json"
            ),
          })
        );
      });
    });
  });

  describe("Pass wrong org uid through flag", () => {
    beforeEach(() => {
      sandbox.stub(commonUtils, "getOrganizations").callsFake(async () => []);
    });

    it("should fail with error message", async () => {
      const { stdout } = await runCommand(["app:get", "--org", "test-uid-1"]);
      expect(stdout).to.contain(messages.ORG_UID_NOT_FOUND);
    });
  });
});
