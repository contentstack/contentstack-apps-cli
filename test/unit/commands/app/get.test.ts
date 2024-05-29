import fs from "fs";
import { join } from "path";
import { PassThrough } from "stream";
import { test, expect } from "@oclif/test";
import { cliux, configHandler, ux } from "@contentstack/cli-utilities";

import config from "../../../../src/config";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../config/manifest.json";
import messages, { $t } from "../../../../src/messages";
import * as commonUtils from "../../../../src/util/common-utils";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = configHandler.get("developerHubBaseUrl");

describe("app:get", () => {
  describe("Get app manifest", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "readdirSync", () => [])
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
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
          .get(
            "/manifests?limit=50&asc=name&include_count=true&skip=0&target_type=stack"
          )
          .reply(200, {
            data: mock.apps,
          })
      )
      .command(["app:get", "--data-dir", join(process.cwd(), "test", "unit")])
      .do(({ stdout }) =>
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              `${config.defaultAppFileName}.json`
            ),
          })
        )
      )
      .it("should return manifest for selected app");
  });

  describe("Get app manifest with app uid", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "readdirSync", () => [])
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async () => "test org 1")
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
      .command([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit"),
        "--app-uid",
        "app-uid-1",
      ])
      .do(({ stdout }) =>
        expect(stdout).to.contain(
          $t(messages.FILE_WRITTEN_SUCCESS, {
            file: join(
              process.cwd(),
              "test",
              "unit",
              `${config.defaultAppFileName}.json`
            ),
          })
        )
      )
      .it("should return manifest for specific uid passed");
  });

  describe("Ask confirmation if `manifest.json` exists and go with `Yes` option", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "readdirSync", () => ["manifest.json"])
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .stub(cliux, "confirm", async () => false)
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
          .reply(200, {
            data: mock.apps,
          })
      )
      .command([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit", "config"),
      ])
      .do(({ stdout }) =>
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
        )
      )
      .it("Should create config file with the +1 mechanism");
  });

  describe("Ask confirmation if `manifest.json` exists and go with `No` option", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "readdirSync", () => ["manifest.json"])
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .stub(cliux, "confirm", async () => true)
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
          .reply(200, {
            data: mock.apps,
          })
      )
      .command([
        "app:get",
        "--data-dir",
        join(process.cwd(), "test", "unit", "config"),
      ])
      .do(({ stdout }) =>
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
        )
      )
      .it("Should overwrite config file with");
  });

  describe("Pass wrong org uid through flag", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(commonUtils, "getOrganizations", async () => [])
      .command(["app:get", "--org", "test-uid-1"])
      .exit(1)
      .do(({ stdout }) => expect(stdout).to.contain(messages.ORG_UID_NOT_FOUND))
      .it("should fail with error message");
  });
});
