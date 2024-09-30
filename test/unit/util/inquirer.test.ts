import { expect } from "chai";
import nock from "nock";
import { join } from "path";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import messages, { $t } from "../../../src/messages";
import * as mock from "../mock/common.mock.json";
import fs from "fs";
import {
  getOrg,
  getAppName,
  getDirName,
  getDeveloperHubUrl,
} from "../../../src/util";
import {
  cliux,
  FlagInput,
  configHandler,
  ContentstackClient,
  managementSDKClient,
} from "@contentstack/cli-utilities";

const region = configHandler.get("region");

describe("Utility Functions", () => {
  let sandbox: sinon.SinonSandbox;
  let managementSdk: ContentstackClient;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    managementSdk = await managementSDKClient({
      host: region.cma.replace("https://", ""),
    });
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("getAppName", () => {
    describe("show prompt to get name from user", () => {
      beforeEach(() => {
        sandbox.stub(cliux, "inquire").resolves("Test name");
      });
      it("should return the name provided by the user", async () => {
        const name = await getAppName();
        expect(name).to.equal("Test name");
      });
    });

    describe("Check user input length validation", () => {
      beforeEach(() => {
        sandbox.stub(cliux, "inquire").callsFake(async (getApp: any) => {
          return getApp.validate("t1");
        });
      });
      it("should return validation message for short input", async () => {
        const stdout = await getAppName();
        expect(stdout).to.contain(
          $t(messages.INVALID_NAME, { min: "3", max: "20" })
        );
      });
    });
  });

  describe("getDirName", () => {
    describe("Show prompt to get directory name from user", () => {
      beforeEach(() => {
        sandbox.stub(cliux, "inquire").resolves("test");
      });

      it("should return the directory name provided by the user", async () => {
        const path = await getDirName(join(process.cwd(), "test"));
        expect(path).to.equal(join(process.cwd(), "test"));
      });
    });

    describe("Check directory length validation", () => {
      beforeEach(() => {
        sandbox.stub(cliux, "inquire").callsFake(async (prompt: any) => {
          const validation = prompt.validate("t");
          return validation;
        });
      });

      it("should return validation message for short input", async () => {
        try {
          await getDirName(join(process.cwd(), "t"));
        } catch (err: any) {
          expect(err.message).to.contain(
            $t(messages.INVALID_NAME, { min: "3", max: "30" })
          );
        }
      });
    });

    describe("Validate if provided directory exists", () => {
      beforeEach(() => {
        sandbox.stub(cliux, "inquire").resolves("test");
        sandbox.stub(fs, "existsSync").returns(true);
      });

      it("should return validation message if directory already exists", async () => {
        try {
          await getDirName(join(process.cwd(), "test"));
        } catch (err: any) {
          expect(err.message).to.contain(messages.DIR_EXIST);
        }
      });
    });
  });

  describe("getOrg", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "inquire").resolves("test org 1");
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });
    });
    describe("Select an organization from list", () => {
      it("should return the organization UID", async () => {
        const org = await getOrg({} as FlagInput, {
          log: () => {},
          managementSdk,
        });
        expect(org).to.equal(mock.organizations[0].uid);
      });
    });
    describe("Passing wrong organization uid through flag", () => {
      it("should fail with error `org uid not found`", async () => {
        try {
          await getOrg({ org: "test org 3" } as unknown as FlagInput, {
            log: () => {},
            managementSdk,
          });
        } catch (err: any) {
          expect(err.message).to.contain(messages.ORG_UID_NOT_FOUND);
        }
      });
    });
  });
  describe("getDeveloperHubUrl", () => {
    describe("Get developer hub base URL", () => {
      beforeEach(() => {
        sandbox.stub(configHandler, "get").returns({
          cma: "https://api.example.com",
          name: "Test",
        });
        sandbox.stub(cliux, "inquire").callsFake(async () => {
          return "https://api.example.com";
        });
      });
      it("should return the developer hub base URL", async () => {
        const url = await getDeveloperHubUrl();
        expect(url).to.equal("developerhub-api.example.com");
      });
    });

    describe("Validate marketplace URL if empty", () => {
      it("should print URL validation message and ask for new input", async () => {
        sandbox.stub(cliux, "inquire").resolves("invalid-url");
        try {
          await runCommand("app:create", {
            root: process.cwd(),
          });
        } catch (err: any) {
          expect(err.message).to.contain("Please enter a valid URL");
        }
      });
    });
  });
});
