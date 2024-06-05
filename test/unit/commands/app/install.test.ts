import { ux, cliux, configHandler } from "@contentstack/cli-utilities";
import {expect, test} from "@oclif/test";

import * as mock from "../../mock/common.mock.json"

import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string, cda: string, name: string } = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:install", () => {
    describe("Install an app on organization", () => {
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
            .post(`/manifests/${mock.apps[1].uid}/install`, {
                "target_type": mock.apps[1].target_type,
                "target_uid": mock.organizations[0].uid
            })
            .reply(200, {
            data: mock.apps,
            })
        )
        .command([
            "app:install"
        ])
        .do(({stdout}) => {
            expect(stdout).to.contain($t(messages.INSTALLING_APP_NOTICE, {
                app: mock.apps[1].name,
                type: mock.apps[1].target_type,
                target: mock.organizations[0].uid
            }))
        })
        .it("should install an organization app")
    })
    describe("Install an app on a stack", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                App: mock.apps[0].name,
                Organization: mock.organizations[0].name,
                Stack: mock.stacks[0].name
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
            .post(`/manifests/${mock.apps[0].uid}/install`, {
                "target_type": mock.apps[0].target_type,
                "target_uid": mock.stacks[0].api_key
            })
            .reply(200, {
            data: mock.apps,
            })
        )
        .command([
            "app:install"
        ])
        .do(({stdout}) => {
            expect(stdout).to.contain($t(messages.APP_INSTALLED_SUCCESSFULLY, {
                app: mock.apps[0].name,
                target: mock.stacks[0].name
            }))
        })
        .it("should install a stack app")
    })
    describe("Stack API Key and App ID provided through flags", () => {
        test
        .stdout({ print: process.env.PRINT === "true" || false })
        .stub(ux.action, "stop", () => {})
        .stub(ux.action, "start", () => {})
        .stub(cliux, "inquire", async (...args: any) => {
            const [prompt]: any = args;
            const cases = {
                Organization: mock.organizations[0].name,
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
            .get(`/v3/stacks`)
            .reply(200, { stack: mock.stacks[0] })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
            .get(`/manifests/${mock.apps[0].uid}`)
            .reply(200, {
            data: mock.apps[0],
            })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
            .post(`/manifests/${mock.apps[0].uid}/install`, {
                "target_type": mock.apps[0].target_type,
                "target_uid": mock.stacks[0].api_key
            })
            .reply(200, {
            data: mock.apps,
            })
        )
        .command([
            "app:install", "--stack-api-key", mock.stacks[0].api_key, "--app-uid", mock.apps[0].uid
        ])
        .do(({stdout}) => {
            expect(stdout).to.contain($t(messages.APP_INSTALLED_SUCCESSFULLY, {
                app: mock.apps[0].name,
                target: mock.stacks[0].name
            }))
        })
        .it("should install a stack app")
    })
    describe("App is already installed", () => {
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
            .post(`/manifests/${mock.apps[1].uid}/install`, {
                "target_type": mock.apps[1].target_type,
                "target_uid": mock.organizations[0].uid
            })
            .replyWithError({
                "status": 400,
                "message": "Installation for app is already done",
                "error": "Internal Server Error"
            })
        )
        .command([
            "app:install"
        ])
        .exit(1)
        .do(({stdout}) => {
            expect(stdout).to.contain("Installation for app is already done")
        })
        .it("should fail with an error that app is already installed")
    })
    // describe("Invalid app provided")
    // describe("Stack API Key is provided, but the app selected is an organization app")
})
