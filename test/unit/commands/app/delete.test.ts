import { expect } from 'chai';
import fancy from 'fancy-test';
import { runCommand } from '@oclif/test';
import { cliux, configHandler } from "@contentstack/cli-utilities";
import sinon from 'sinon';
import * as mock from "../../mock/common.mock.json";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";

const region: { cma: string; name: string; cda: string } = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:delete", () => {
    describe("app:delete with --org and --app-uid flags", () => {
        fancy
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
        .it("should print an error saying that app is already installed", async () => {
            const { stdout } = await runCommand([
                "app:delete", "--org", mock.organizations[0].uid, "--app-uid", mock.apps[0].uid
            ], { root: process.cwd() });
            expect(stdout).to.contain(messages.APP_IS_INSTALLED);
        });
    });

    describe("app:delete using inquirer prompts", () => {
        let inquireStub: sinon.SinonStub;
    
        before(() => {
            inquireStub = sinon.stub(cliux, "inquire").resolves({
                Organization: 'test org 1',
                App: 'App 1',
                confirmation: true
            });
        });
    
        after(() => {
            inquireStub.restore();
        });
    
        fancy
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
            .it("should delete the app", async () => {
                const { stdout } = await runCommand([
                    "app:delete"
                ], { root: process.cwd() });
                expect(stdout).to.contain($t(messages.APP_DELETED_SUCCESSFULLY, { app: mock.apps[0].name }));
            });
    });

    describe("app:delete error handling", () => {
        let inquireStub: sinon.SinonStub;
    
        before(() => {
            inquireStub = sinon.stub(cliux, "inquire").resolves({
                Organization: 'test org 1',
                App: 'App 1',
                confirmation: true
            });
        });
    
        after(() => {
            inquireStub.restore();
        });
    
        fancy
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
                    .replyWithError({
                        "status": 409,
                        "message": [
                            "(1) installations found for this app"
                        ],
                        "error": "Bad Request",
                        "statusText": "Conflict"
                    })
            )
            .it("should throw an error while deleting the app", async () => {
                const { stdout, stderr } = await runCommand([
                    "app:delete"
                ], { root: process.cwd() });
                expect(stderr).to.contain("Error: Bad Request");
                expect(stdout).to.contain(messages.CONTACT_SUPPORT);
            });
    });
});
