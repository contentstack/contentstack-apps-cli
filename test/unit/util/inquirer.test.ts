import { fancy } from "fancy-test";
import { expect } from "@oclif/test";
import {
  cliux,
  FlagInput,
  configHandler,
  ContentstackClient,
  managementSDKClient,
} from "@contentstack/cli-utilities";

import { LogFn } from "../../../src/types";
import * as mock from "../mock/common.mock.json";
import messages, { $t } from "../../../src/messages";
import {
  getOrg,
  getAppName,
  getDirName,
  getDeveloperHubUrl,
} from "../../../src/util";
import * as commonUtils from "../../../src/util/common-utils";
import { join } from "path";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");

describe("inquirer util", () => {
  const log: LogFn = () => {};
  let managementSdk: ContentstackClient;

  before(async () => {
    managementSdk = await managementSDKClient({
      host: region.cma.replace("https://", ""),
    });
  });

  describe("getAppName", () => {
    describe("show prompt to get name from user", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(cliux, "inquire", async () => "Test name")
        .it("Returns name string", async () => {
          const name = await getAppName();
          expect(name).to.equal("Test name");
        });
    });

    describe("Check user input length validation", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stdin("\n")
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit("data", "Test 1\n");
          }, 1);
          await getAppName("t1");
        })
        .it("Returns validation message", ({ stdout }) => {
          expect(stdout).to.contains(
            $t(messages.INVALID_NAME, { min: "3", max: "20" })
          );
        });
    });
  });

  describe("getDirName", () => {
    describe("Show prompt to get name from user", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(cliux, "inquire", async () => "test")
        .it("returns path", async () => {
          const path = await getDirName(join(process.cwd(), "test"));
          expect(path).to.equal(join(process.cwd(), "test"));
        });
    });

    describe("Check user input directory length validation", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stdin("\n")
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit("data", "test-1\n");
          }, 1);
          await getDirName(join(process.cwd(), "t1"));
        })
        .it("returns validation message", ({ stdout }) => {
          expect(stdout).to.contains(
            $t(messages.INVALID_NAME, { min: "3", max: "50" })
          );
        });
    });

    describe("Validate if provided directory exist", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stdin("test\n")
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit("data", "test-1\n");
          }, 1);
          await getDirName(join(process.cwd(), "test"));
        })
        .it("returns validation message", ({ stdout }) => {
          expect(stdout).to.contains(messages.DIR_EXIST);
        });
    });
  });

  describe("getOrg", () => {
    describe("Select an organization from list", () => {
      fancy
        .stub(commonUtils, "getOrganizations", async () => mock.organizations)
        .stub(cliux, "inquire", async () => "test org 1")
        .it("Returns a organization uid", async () => {
          const org = await getOrg({} as FlagInput, {
            log,
            managementSdk,
          });
          expect(org).to.equal(mock.organizations[0].uid);
        });
    });

    describe("Passing wrong organization uid through flag", () => {
      fancy
        .stub(commonUtils, "getOrganizations", async () => mock.organizations)
        .do(
          async () =>
            await getOrg({ org: "test org 3" as any } as FlagInput, {
              log,
              managementSdk,
            })
        )
        .catch((ctx) =>
          expect(ctx.message).to.contain(messages.ORG_UID_NOT_FOUND)
        )
        .it("fails with error `org uid not found`");
    });
  });

  describe("getDeveloperHubUrl", () => {
    describe("Get developer hub base url", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(configHandler, "get", async () => ({
          cma: "",
          name: "Test",
        }))
        .stub(cliux, "inquire", async () => "https://dummy.marketplace.com")
        .it("Returns developer hub base url", async () => {
          const url = await getDeveloperHubUrl();
          expect(url).to.equal("dummy.marketplace.com");
        });
    });

    describe("Validate marketplace url if empty.?", () => {
      fancy
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(configHandler, "get", async () => ({
          cma: "",
          name: "Test",
        }))
        .stdin("\n")
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit("data", "dummy.marketplace.com\n");
          }, 1);
          await getDeveloperHubUrl();
        })
        .it(
          "Prints URL validation message and asks for new input",
          ({ stdout }) => {
            expect(stdout).to.contains(messages.BASE_URL_EMPTY);
          }
        );
    });
  });
});
