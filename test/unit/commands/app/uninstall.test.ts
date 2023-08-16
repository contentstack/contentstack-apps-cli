import { ux, cliux, configHandler } from "@contentstack/cli-utilities"
import { expect, test } from "@oclif/test";

import * as mock from "../../mock/common.mock.json"

import config from "../../../../src/config"
import messages, {$t} from "../../../../src/messages";

const region: { cma: string, cda: string, name: string } = configHandler.get("region");
const developerHubBaseUrl = (config.developerHubUrls as Record<string, any>)[region.cma];

describe("app:uninstall", () => {
    describe("Uninstall an app from organization", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                App: mock.apps[1].name,
                Organization: mock.organizations[0].name,
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
            .get(`/manifests/${mock.apps[1].uid}/installations`)
            .reply(200, {
            data: mock.installations,
            })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
            .delete(`/installations/${mock.installations[1].uid}`)
            .reply(200, {
            data: {},
            })
        )
        .command([
            "app:uninstall"
        ])
        .do(({stdout}) => {
            expect(stdout).to.contain($t(messages.APP_UNINSTALLED, {
                app: mock.apps[1].name,
            }))
        })
        .it("should uninstall an organization app")
    })
    describe("Uninstall an app from a stack", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                App: mock.apps[0].name,
                Organization: mock.organizations[0].name,
                appInstallation: mock.installations[0].uid
            };

            return (cases as Record<string, any>)[prompt.name];
        })
        .nock(region.cma, (api) =>
        api
            .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
            .reply(200, { organizations: mock.organizations })
        )
        .nock(region.cma, (api) =>
        api
            .get(`/v3/organizations/${mock.organizations[0].uid}/stacks?limit=100&asc=name&include_count=true&skip=0`)
            .reply(200, { stacks: mock.stacks })
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
            .get(`/manifests/${mock.apps[0].uid}/installations`)
            .reply(200, {
            data: mock.installations,
            })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
            .delete(`/installations/${mock.installations[0].uid}`)
            .reply(200, {
            data: {},
            })
        )
        .command([
            "app:uninstall"
        ])
        .do(({stdout}) => {
            expect(stdout).to.contain($t(messages.APP_UNINSTALLED, {
                app: mock.apps[0].name,
            }))
        })
        .it("should uninstall a stack app")
    })
    describe("Fail to uninstall an app from a stack", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                App: mock.apps[0].name,
                Organization: mock.organizations[0].name,
                appInstallation: mock.installations[0].uid
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
            .delete(`/installations/wrong-uid`)
            .replyWithError({
                "status": 404,
                "message": "App with id wrong-uid not installed",
                "error": "Not Found"
            })
        )
        .command([
            "app:uninstall", "--installation-uid", "wrong-uid"
        ])
        .exit(1)
        .do(({stdout}) => {
            expect(stdout).to.contain("App with id wrong-uid not installed")
        })
        .it("should fail with an error")
    });
})
