import fs from "fs";
import tmp from "tmp";
import axios from "axios";
import { join, resolve } from "path";
import shelljs from "shelljs";
import { PassThrough } from "stream";

import { expect, test } from "@oclif/test";
import { cliux, ux, configHandler } from "@contentstack/cli-utilities";

import config from "../../../../src/config";
import messages from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../../../src/config/manifest.json";

const gitHubHost = "https://github.com";
const zipPath = join(process.cwd(), "test", "unit", "mock", "boilerplate.zip");
const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = (config.developerHubUrls as Record<string, any>)[
  region.cma
];

describe("app:create", () => {
  beforeEach(() => {
    axios.defaults.adapter = "http";
  });

  describe("Creating a stack app using a boilerplate flow", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(shelljs, "cd", () => {})
      .stub(shelljs, "exec", (...args) => {
        const [, , callback]: any = args;
        callback(0);
      })
      .stub(fs, "renameSync", () => new PassThrough())
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(fs, "createWriteStream", () => new PassThrough())
      .stub(tmp, "fileSync", () => ({ name: zipPath }))
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(gitHubHost, (api) =>
        api
          .get(config.appBoilerplateGithubUrl.replace(gitHubHost, ""))
          .reply(200, { data: "test-data" })
      )
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .post("/manifests", { ...manifestData, name: "test-app" })
          .reply(200, {
            data: { ...manifestData, name: "test-app", version: 1 },
          })
      )
      .command(["app:create", "--data-dir", process.cwd()])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_CREATION_SUCCESS)
      )
      .it("should create a stack level app");
  });

  describe("Creating a organization app using a boilerplate flow", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(shelljs, "cd", () => {})
      .stub(shelljs, "exec", (...args) => {
        const [, , callback]: any = args;
        callback(0);
      })
      .stub(fs, "renameSync", () => new PassThrough())
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(fs, "createWriteStream", () => new PassThrough())
      .stub(tmp, "fileSync", () => ({ name: zipPath }))
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(gitHubHost, (api) =>
        api
          .get(config.appBoilerplateGithubUrl.replace(gitHubHost, ""))
          .reply(200, { data: "test-data" })
      )
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .post("/manifests", {
            ...manifestData,
            name: "test-app",
            target_type: "organization",
          })
          .reply(200, {
            data: { ...manifestData, name: "test-app", version: 1 },
          })
      )
      .command([
        "app:create",
        "--data-dir",
        process.cwd(),
        "--app-type",
        "organization",
      ])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_CREATION_SUCCESS)
      )
      .it("should create a organization level app");
  });

  describe("Creating a app without boilerplate", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "renameSync", () => new PassThrough())
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: false,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .post("/manifests", { ...manifestData, name: "test-app" })
          .reply(200, {
            data: { ...manifestData, name: "test-app", version: 1 },
          })
      )
      .command(["app:create", "--data-dir", process.cwd()])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_CREATION_SUCCESS)
      )
      .it("should create a stack level app");
  });

  describe("Boilerplate clone failure", () => {
    test
      .stderr({ print: false })
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(
        fs,
        "createWriteStream",
        () =>
          new PassThrough({
            final(callback) {
              callback(new Error("Failed to write"));
            },
          })
      )
      .stub(tmp, "fileSync", () => ({ name: zipPath }))
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(gitHubHost, (api) =>
        api
          .get(config.appBoilerplateGithubUrl.replace(gitHubHost, ""))
          .reply(200)
      )
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .command(["app:create", "--data-dir", process.cwd()])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.FILE_GENERATION_FAILURE)
      )
      .it("Boilerplate clone exits with status code 1");
  });

  describe("App creation should fail and rollback", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: false,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.post("/manifests", { ...manifestData, name: "test-app" }).reply(400)
      )
      .command(["app:create", "--data-dir", process.cwd()])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_CREATION_CONSTRAINT_FAILURE)
      )
      .it("App creation should fail!");
  });

  describe("Pass external config using '--config' flag", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: false,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.post("/manifests", { ...manifestData, name: "test-app" }).reply(400)
      )
      .command([
        "app:create",
        "--data-dir",
        process.cwd(),
        "--config",
        resolve(process.cwd(), "test", "unit", "mock", "config.json"),
      ])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_CREATION_CONSTRAINT_FAILURE)
      )
      .it("App creation should fail!");
  });

  describe("Dependency installation failure", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(shelljs, "cd", () => {})
      .stub(shelljs, "exec", (...args) => {
        const [, , callback]: any = args;
        callback("Dependency installation failed.!");
      })
      .stub(fs, "renameSync", () => new PassThrough())
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(fs, "createWriteStream", () => new PassThrough())
      .stub(tmp, "fileSync", () => ({ name: zipPath }))
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(gitHubHost, (api) =>
        api
          .get(config.appBoilerplateGithubUrl.replace(gitHubHost, ""))
          .reply(200, { data: "test-data" })
      )
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .post("/manifests", { ...manifestData, name: "test-app" })
          .reply(200, {
            data: { ...manifestData, name: "test-app", version: 1 },
          })
      )
      .command(["app:create", "--data-dir", process.cwd()])
      .do(({ stdout }) =>
        expect(stdout).to.contain("Dependency installation failed.!")
      )
      .it("dependency install step should fail");
  });
});
