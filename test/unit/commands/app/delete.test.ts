import { test, expect } from "@oclif/test";
import { cliux, configHandler, ux } from "@contentstack/cli-utilities";
import * as mock from "../../mock/common.mock.json"

import config from "../../../../src/config";
import messages, {$t} from "../../../../src/messages";

const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = (config.developerHubUrls as Record<string, any>)[
  region.cma
];

describe("app:delete", () => {
    describe("app:delete with --org and --app-uid flags", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .nock(region.cma, (api) =>
            api
            .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
            .reply(200, { organizations: mock.organizations })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
            api
            .get("/manifests/app-uid-1/installations")
            .reply(200, {
                data: mock.installations,
            })
        )
        .command([
            "app:delete", "--org", mock.organizations[0].uid, "--app-uid", mock.apps[0].uid
        ])
        .do(({ stdout }) => {
            expect(stdout).to.contain(messages.APP_IS_INSTALLED)
        })
        .it("should print an error saying that app is already installed")
    });
    describe("app:delete using inquirer prompts", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                Organization: 'test org 1',
                App: 'App 1'
            }
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
            .get("/manifests/app-uid-1/installations")
            .reply(200, {
                data: [],
            })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
            api
            .delete("/manifests/app-uid-1")
            .reply(200, {
                data: {},
            })
        )
        .command([
            "app:delete"
        ])
        .do(({ stdout }) => {
            expect(stdout).to.contain($t(messages.APP_DELETED_SUCCESSFULLY, {app: mock.apps[0].name}))
        })
        .it("should delete the app")
    });
})