import fs from "fs";
import axios from "axios";
import { join } from "path";
import { PassThrough } from "stream";
import { expect, test } from "@oclif/test";
import { cliux } from "@contentstack/cli-utilities";

import config from "../../../src/config";
import * as mock from "../mock/create.mock.json";
import * as commonUtility from "../../../src/util/common-utils";
import { organization } from "../util/contentstack-management-sdk";

const gitHubHost = "https://github.com";
const zipPath = join(process.cwd(), "test", "unit", "mock", "boilerplate.zip");

describe("app:create", () => {
  beforeEach(() => {
    axios.defaults.adapter = "http";
  });

  test
    .stdout({ print: true })
    .stub(require("shelljs"), "cd", () => {})
    .stub(require("shelljs"), "exec", (...args) => {
      const [, , callback]: any = args;
      callback(0);
    })
    .stub(fs, "renameSync", () => new PassThrough())
    .stub(fs, "writeFileSync", () => new PassThrough())
    .stub(fs, "createWriteStream", () => new PassThrough())
    .stub(require("tmp"), "fileSync", () => ({ name: zipPath }))
    .stub(require("adm-zip").prototype, "extractAllToAsync", () => {})
    .stub(
      require("@contentstack/cli-utilities"),
      "managementSDKClient",
      () => async () => ({
        organization,
      })
    )
    .stub(commonUtility, "getOrganizations", async () => mock.organizations)
    .stub(cliux, "inquire", async (...args: any) => {
      const [prompt]: any = args;
      const cases = {
        appName: "test-app",
        cloneBoilerplate: "Y",
        Organization: "test org 1",
      };

      return (cases as Record<string, any>)[prompt.name];
    })
    .nock(gitHubHost, (api) =>
      api
        .get(config.appBoilerplateGithubUrl.replace(gitHubHost, ""))
        .reply(200, { data: "test-data" })
    )
    .command(["app:create", "--data-dir", process.cwd()])
    .it("should create a project", (ctx) => {
      expect(ctx.stdout).to.contain("info: App creation successful!");
    });
});
