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
import { stubAuthentication } from "../../helpers/auth-stub-helper";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:get", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub authentication using shared helper
    stubAuthentication(sandbox);

    sandbox.stub(cliux, "loader").callsFake(() => {});
    sandbox.stub(fs, "writeFileSync").callsFake(() => {});
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Get app manifest", () => {
    beforeEach(() => {
      sandbox.stub(fs, "readdirSync").returns([]);
      sandbox.stub(cliux, "inquire").callsFake(async (...args) => {
        const [prompt] = args as any;
        const cases: Record<string, any> = {
          App: "App 1",
          Organization: "test org 1",
        };
        return cases[prompt.name];
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

    it("should return manifest for selected app", async () => {
      const result = await runCommand([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit"),
      ]);
      expect(result.stdout).to.contain(
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
      sandbox.stub(fs, "readdirSync").returns([]);
      sandbox.stub(cliux, "inquire").resolves("test org 1");

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

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

  describe("Ask confirmation if `manifest.json` exists and go with `Yes` option", () => {
    beforeEach(() => {
      sandbox
        .stub(fs, "readdirSync")
        .returns(["manifest.json"] as any);
      sandbox.stub(cliux, "confirm").resolves(false);
      sandbox.stub(cliux, "inquire").resolves("test org 1");

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get(
          "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
        )
        .reply(200, { data: mock.apps });
    });

    it("Should create config file with the +1 mechanism", async () => {
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
  });

  describe("Ask confirmation if `manifest.json` exists and go with `No` option", () => {
    beforeEach(() => {
      sandbox
        .stub(fs, "readdirSync")
        .returns(["manifest.json"] as any);
      sandbox.stub(cliux, "confirm").resolves(true);
      sandbox.stub(cliux, "inquire").resolves("test org 1");

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get(
          "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
        )
        .reply(200, { data: mock.apps });
    });

    it("Should overwrite config file", async () => {
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
            `${config.defaultAppFileName}.json`
          ),
        })
      );
    });
  });

  describe("Pass wrong org uid through flag", () => {
    beforeEach(() => {
      sandbox.stub(commonUtils, "getOrganizations").resolves([]);
    });

    it("should fail with error message", async () => {
      const { stdout } = await runCommand(["app:get", "--org", "test-uid-1"]);
      expect(stdout).to.contain(messages.ORG_UID_NOT_FOUND);
    });
  });
});
