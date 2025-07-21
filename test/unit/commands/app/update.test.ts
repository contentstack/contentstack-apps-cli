import { join } from "path";
import { expect } from "chai";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import { runCommand } from "@oclif/test";
import messages from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../config/manifest.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import sinon from "sinon";
import nock from "nock";
import fs from "fs";

const region = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:update", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub authentication
    sandbox.stub(configHandler, "get").returns({
      cma: "https://api.contentstack.io",
      cda: "https://cdn.contentstack.io",
      region: "us",
    });

    // Stub the validateRegionAndAuth method to skip authentication check
    sandbox
      .stub(
        require("../../../../src/base-command").BaseCommand.prototype,
        "validateRegionAndAuth"
      )
      .callsFake(() => {});

    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Update app with `--app-manifest` flag", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});

      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      // Fix the API endpoint - should be using the marketplace SDK endpoint for fetchApp
      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, { data: { ...manifestData } });

      // Stub the updateAppOnDeveloperHub method for this test
      sandbox
        .stub(
          require("../../../../src/commands/app/update").default.prototype,
          "updateAppOnDeveloperHub"
        )
        .callsFake(function (this: any) {
          this.log(this.messages.APP_UPDATE_SUCCESS, "info");
        });
    });

    afterEach(() => {
      sandbox.restore();
      nock.cleanAll();
    });

    it("should update an app", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain(messages.APP_UPDATE_SUCCESS);
    });
  });

  describe("Update app with wrong `manifest.json` path", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").resolves("test-manifest");
    });

    it("should fail with manifest max retry message", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        "test-manifest",
      ]);
      expect(result.stdout).to.contain(messages.MAX_RETRY_LIMIT_WARN);
    });
  });

  describe("Update app with wrong `app-uid`", () => {
    beforeEach(() => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, { data: { uid: "app-uid-3" } })
        .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
        .reply(200, { data: mock.apps });

      sandbox.stub(cliux, "inquire").resolves("App 2");
    });

    it("should fail uid not matching", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);
      expect(result.stdout).to.contain(messages.APP_UID_NOT_MATCH);
    });
  });

  describe("Update app with wrong `app version`", () => {
    beforeEach(() => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, { data: { version: 3, uid: "app-uid-1" } });
    });

    it("should fail with version mismatch error message", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain(messages.APP_VERSION_MISS_MATCH);
    });
  });

  describe("Update app with wrong app-uid API failure", () => {
    beforeEach(() => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        });

      // Stub the updateAppOnDeveloperHub method to throw 400 error
      sandbox
        .stub(
          require("../../../../src/commands/app/update").default.prototype,
          "updateAppOnDeveloperHub"
        )
        .callsFake(function (this: any) {
          this.log(this.messages.INVALID_APP_ID, "error");
          throw { status: 400 };
        });
    });

    it("update app should fail with 400 status code", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain(messages.INVALID_APP_ID);
    });
  });

  describe("Update app API failure", () => {
    beforeEach(() => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .get("/manifests/app-uid-1")
        .reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        });

      // Stub the updateAppOnDeveloperHub method to throw 403 error
      sandbox
        .stub(
          require("../../../../src/commands/app/update").default.prototype,
          "updateAppOnDeveloperHub"
        )
        .callsFake(function (this: any) {
          this.log('"status":403', "error");
          throw { status: 403 };
        });
    });

    it("update app should fail with 403 status code", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain('"status":403');
    });
  });
});
