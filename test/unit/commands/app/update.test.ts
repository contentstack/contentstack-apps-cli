import fs from "fs";
import { join } from "path";
import { PassThrough } from "stream";

import { expect, test } from "@oclif/test";
import { cliux, ux, configHandler } from "@contentstack/cli-utilities";

import config from "../../../../src/config";
import messages from "../../../../src/messages";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../config/manifest.json";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = (config.developerHubUrls as Record<string, any>)[
  region.cma
];

describe("app:update", () => {
  describe("Update app with `--app-manifest` flag", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .command([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_UPDATE_SUCCESS)
      )
      .it("should update a app");
  });

  describe("Update app with `--data-dir` flag", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .command([
        "app:update",
        "--data-dir",
        join(process.cwd(), "test", "unit", "config"),
      ])
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_UPDATE_SUCCESS)
      )
      .it("should update a app");
  });

  describe("Update app with wrong `manifest.json` path", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          appUid: "app-uid-1",
          Organization: "test org 1",
          appManifest: "test-manifest",
        };

        return (cases as Record<string, any>)[prompt.name];
      })
      .nock(region.cma, (api) =>
        api
          .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
          .reply(200, { organizations: mock.organizations })
      )
      .command(["app:update"])
      .exit(1)
      .do(({ stdout }) => expect(stdout).to.contain(messages.MAX_RETRY_LIMIT))
      .it("should fail with manifest max retry message");
  });

  describe("Update app with wrong `app-uid`", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 2",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .command([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ])
      .exit(1)
      .do(({ stdout }) => expect(stdout).to.contain(messages.MAX_RETRY_LIMIT))
      .it("should fail with max retry message");
  });

  describe("Update app with wrong `app version`", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 2 },
        })
      )
      .command([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ])
      .exit(1)
      .do(({ stdout }) =>
        expect(stdout).to.contain(messages.APP_VERSION_MISS_MATCH)
      )
      .it("should fail with version miss match error message");
  });

  describe("Update app wrong app-uid API failure", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put("/manifests/app-uid-1").reply(400, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .command([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ])
      .exit(1)
      .do(({ stdout }) => expect(stdout).to.contain(messages.INVALID_APP_ID))
      .it("update app should fail with 400 status code");
  });

  describe("Update app wrong org-uid API failure", () => {
    test
      .stdout({ print: process.env.PRINT === "true" || false })
      .stub(ux.action, "stop", () => {})
      .stub(ux.action, "start", () => {})
      .stub(fs, "writeFileSync", () => new PassThrough())
      .stub(cliux, "inquire", async (...args: any) => {
        const [prompt]: any = args;
        const cases = {
          App: "App 1",
          Organization: "test org 1",
          appManifest: "test-manifest",
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
          .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
          .reply(200, {
            data: mock.apps,
          })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.get("/manifests/app-uid-1").reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api.put("/manifests/app-uid-1").reply(403, {
          data: { ...manifestData, name: "test-app", version: 1 },
        })
      )
      .command([
        "app:update",
        "--app-manifest",
        join(process.cwd(), "test", "unit", "config", "manifest.json"),
      ])
      .exit(1)
      .do(({ stdout }) => expect(stdout).to.contain(messages.APP_INVALID_ORG))
      .it("update app should fail with 403 status code");
  });
});
