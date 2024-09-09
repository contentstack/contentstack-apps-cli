import { configHandler, cliux } from "@contentstack/cli-utilities";
import { expect } from 'chai';
import fancy from 'fancy-test';
import { runCommand } from '@oclif/test';
import * as mock from "../../mock/common.mock.json";
import messages, { $t } from "../../../../src/messages";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import sinon from 'sinon';

const region: { cma: string; cda: string; name: string } = configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

describe("app:deploy", () => {
    let inquireStub: sinon.SinonStub;

    beforeEach(() => {
        inquireStub = sinon.stub(cliux, "inquire");
    });

    afterEach(() => {
        inquireStub.restore();
    });

    describe("Deploy an app with custom hosting", () => {
        beforeEach(() => {
            inquireStub.withArgs(sinon.match.has("name", "App")).resolves(mock.apps[1].name);
            inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves(mock.organizations[0].name);
            inquireStub.withArgs(sinon.match.has("name", "hosting types")).resolves("Custom Hosting");
            inquireStub.withArgs(sinon.match.has("name", "appUrl")).resolves("https://example.com");
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
            .reply(200, { data: mock.apps2 })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
            api
            .put(`/manifests/${mock.apps2[1].uid}`)
            .reply(200, mock.deploy_custom_host)
        )
        .it("should deploy the app with custom hosting", async () => {
            const { stdout } = await runCommand(["app:deploy"], { root: process.cwd() });
            expect(stdout).to.contain($t(messages.APP_DEPLOYED, { app: mock.apps2[1].name }));
        });
    });

    describe("Deploy an app with custom hosting using flags in command", () => {
        beforeEach(() => {
            inquireStub.withArgs(sinon.match.has("name", "App")).resolves(mock.apps[1].name);
            inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves(mock.organizations[0].name);
            inquireStub.withArgs(sinon.match.has("name", "hosting types")).resolves("Custom Hosting");
            inquireStub.withArgs(sinon.match.has("name", "appUrl")).resolves("https://example.com");
        });

        fancy
        .nock(region.cma, (api) =>
            api
            .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
            .reply(200, { organizations: mock.organizations })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
            api
            .get(`/manifests/${mock.apps[1].uid}`)
            .reply(200, { data: mock.apps[1] })
        )
        .nock(`https://${developerHubBaseUrl}`, (api) =>
            api
            .put(`/manifests/${mock.apps[1].uid}`)
            .reply(200, mock.deploy_custom_host)
        )
        .it("should deploy the app with custom hosting using flags in command", async () => {
            const { stdout } = await runCommand([
                "app:deploy",
                "--org",
                mock.organizations[0].uid,
                "--app-uid",
                mock.apps[1].uid,
                "--hosting-type",
                "Custom Hosting",
                "--app-url",
                "https://example.com"
            ], { root: process.cwd() });
            expect(stdout).to.contain($t(messages.APP_DEPLOYED, { app: mock.apps[1].name }));
        });
    });

    // describe("Deploy an app with Hosting with Launch with existing project", () => {
    //     beforeEach(() => {
    //         inquireStub.withArgs(sinon.match.has("name", "App")).resolves(mock.apps2[1].name);
    //         inquireStub.withArgs(sinon.match.has("name", "Organization")).resolves(mock.organizations[0].name);
    //         inquireStub.withArgs(sinon.match.has("name", "hosting types")).resolves("Hosting with Launch");
    //         inquireStub.withArgs(sinon.match.has("name", "provider")).resolves("launch");
    //         inquireStub.withArgs(sinon.match.has("name", "selected_launch_project")).resolves("existing");
    //         inquireStub.withArgs(sinon.match.has("name", "deployment_url")).resolves("https://example.com");
    //         inquireStub.withArgs(sinon.match.has("name", "environment_uid")).resolves("environment_uid");
    //         inquireStub.withArgs(sinon.match.has("name", "project_uid")).resolves("project_uid");
    //     });

    //     fancy
    //     .nock(region.cma, (api) =>
    //         api
    //         .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
    //         .reply(200, { organizations: mock.organizations })
    //     )
    //     .nock(`https://${developerHubBaseUrl}`, (api) =>
    //         api
    //         .get("/manifests?limit=50&asc=name&include_count=true&skip=0")
    //         .reply(200, { data: mock.apps2 })
    //     )
    //     .nock(`https://${developerHubBaseUrl}`, (api) =>
    //         api
    //         .put(`/manifests/${mock.apps2[1].uid}`)
    //         .reply(200, mock.deploy_launch_host)
    //     )
    //     .it("should deploy the app with Hosting with Launch with existing project", async () => {
    //         const { stdout } = await runCommand(["app:deploy"], { root: process.cwd() });
    //         expect(stdout).to.contain($t(messages.APP_DEPLOYED, { app: mock.apps2[1].name }));
    //     });
    // });
});