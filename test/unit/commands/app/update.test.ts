import { join } from "path";
import { expect } from "chai";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import { runCommand } from "@oclif/test";
import messages from "../../../../src/messages";
const mock = (global as any).commonMock;
import manifestData from "../../config/manifest.json";
import sinon from "sinon";
import nock from "nock";
import fs from "fs";
import { stubAuthentication } from "../../helpers/auth-stub-helper";
import Update from "../../../../src/commands/app/update";
import { BaseCommand } from "../../../../src/base-command";

const region = configHandler.get("region");

// Commands run from lib/ (oclif); stub the same class the running command uses
let BaseCommandToStub: typeof BaseCommand;
let LibUpdate: typeof Update;
try {
  BaseCommandToStub = require(join(process.cwd(), "lib", "base-command")).BaseCommand;
} catch {
  BaseCommandToStub = BaseCommand;
}
try {
  LibUpdate = require(join(process.cwd(), "lib", "commands", "app", "update")).default;
} catch {
  LibUpdate = Update;
}

/** Optional override: return a custom marketplace SDK mock for this test. */
let marketplaceMockOverride: any = null;

function stubUpdateInit(sandbox: sinon.SinonSandbox) {
  const mockManagementSdk = {
    organization: () => ({
      fetchAll: () =>
        Promise.resolve({
          items: mock.organizations,
          count: mock.organizations.length,
        }),
    }),
  };
  const defaultMarketplaceSdk = {
    marketplace: () => ({
      app: (uid: string) => ({
        fetch: () =>
          Promise.resolve({
            ...manifestData,
            uid: uid || "app-uid-1",
            version: 1,
            name: "test-app",
          }),
        update: () => Promise.resolve({ ...manifestData, uid: "app-uid-1", version: 1 }),
      }),
    }),
  };
  sandbox.stub(BaseCommandToStub.prototype, "initCmaSDK").callsFake(async function (this: any) {
    this.managementSdk = mockManagementSdk;
    this.managementAppSdk = mockManagementSdk;
  });
  sandbox.stub(BaseCommandToStub.prototype, "initMarketplaceSDK").callsFake(async function (this: any) {
    this.marketplaceAppSdk = marketplaceMockOverride ?? defaultMarketplaceSdk;
  });
}

describe("app:update", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    marketplaceMockOverride = null;

    sandbox.stub(process, "exit").callsFake(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as any);

    stubAuthentication(sandbox);
    stubUpdateInit(sandbox);

    nock(region.cma)
      .get("/v3/organizations")
      .query(true)
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

      sandbox
        .stub(LibUpdate.prototype, "updateAppOnDeveloperHub")
        .callsFake(async function (this: any) {
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
      marketplaceMockOverride = {
        marketplace: () => ({
          app: () => ({
            fetch: () =>
              Promise.resolve({
                ...manifestData,
                uid: "app-uid-3",
                version: 1,
                name: "test-app",
              }),
            update: () => Promise.resolve({}),
          }),
        }),
      };
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
      marketplaceMockOverride = {
        marketplace: () => ({
          app: () => ({
            fetch: () =>
              Promise.resolve({
                ...manifestData,
                uid: "app-uid-1",
                version: 3,
                name: "test-app",
              }),
            update: () => Promise.resolve({}),
          }),
        }),
      };
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
      sandbox
        .stub(LibUpdate.prototype, "updateAppOnDeveloperHub")
        .callsFake(async function (this: any) {
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
      sandbox
        .stub(LibUpdate.prototype, "updateAppOnDeveloperHub")
        .callsFake(async function (this: any) {
          this.log(this.messages.APP_INVALID_ORG, "error");
          throw { status: 403 };
        });
    });

    it("update app should fail with 403 status code", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain(messages.APP_INVALID_ORG);
    });
  });
  describe("Update app with duplicate app name (409 status)", () => {
    beforeEach(() => {
      sandbox
        .stub(LibUpdate.prototype, "updateAppOnDeveloperHub")
        .callsFake(async function (this: any) {
          this.log(
            this.$t(this.messages.DUPLICATE_APP_NAME, {
              appName: this.manifestData.name,
            }),
            "warn"
          );
          throw { status: 409 };
        });
    });

    it("should fail with duplicate app name error (409 status)", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain("test-app");
      expect(result.stdout).to.contain("already exists");
    });
  });

  describe("Update app with organization UID instead of app UID", () => {
    beforeEach(() => {
      marketplaceMockOverride = {
        marketplace: () => ({
          app: () => ({
            fetch: () =>
              Promise.resolve({
                uid: "test-uid-1",
                name: "test-org",
                version: 1,
                target_type: "organization",
              }),
            update: () => Promise.resolve({}),
          }),
        }),
      };
      sandbox.stub(cliux, "loader").callsFake(() => {});
    });

    it("should fail when organization UID is passed instead of app UID", async () => {
      const result = await runCommand([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ]);

      expect(result.stdout).to.contain(messages.APP_UID_NOT_MATCH);
    });
  });
});
