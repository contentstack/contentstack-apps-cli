import fancy from 'fancy-test';
import { expect } from 'chai';
import { runCommand } from '@oclif/test';
import { cliux, configHandler } from '@contentstack/cli-utilities';
import * as mock from '../../mock/common.mock.json';
import messages, { $t } from '../../../../src/messages';
import { getDeveloperHubUrl } from '../../../../src/util/inquirer';
import sinon from 'sinon';
const region: { cma: string; cda: string; name: string } = configHandler.get('region');
const developerHubBaseUrl = getDeveloperHubUrl();

describe('app:uninstall', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('Uninstall an app from organization', () => {
    fancy
      .stub(cliux, 'inquire', (stub) => 
        stub.callsFake(async (prompt: any) => {
          const responses: Record<string, any> = {
            App: mock.apps[1].name,
            Organization: mock.organizations[0].name,
          };
          return responses[prompt.name];
        })
      )
      .nock(region.cma, (api) =>
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get('/manifests?limit=50&asc=name&include_count=true&skip=0')
          .reply(200, { data: mock.apps })
          .get(`/manifests/${mock.apps[1].uid}/installations`)
          .reply(200, { data: mock.installations })
          .delete(`/installations/${mock.installations[1].uid}`)
          .reply(200, { data: {} })
      )
      .it('should uninstall an organization app', async () => {
        const { stdout } = await runCommand([
          'app:uninstall',
          '--installation-uid',
          mock.installations[1].uid,
        ]);

        expect(stdout).to.contain(
          $t(messages.APP_UNINSTALLED, {
            app: mock.apps[1].name,
          })
        );
      });
  });

  describe('Uninstall an app from a stack', () => {
    fancy
      .stub(cliux, 'inquire', (stub) => 
        stub.callsFake(async (prompt: any) => {
          const responses: Record<string, any> = {
            App: mock.apps[0].name,
            Organization: mock.organizations[0].name,
            appInstallation: mock.installations[0].uid,
          };
          return responses[prompt.name];
        })
      )
      .nock(region.cma, (api) =>
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get('/manifests?limit=50&asc=name&include_count=true&skip=0')
          .reply(200, { data: mock.apps })
          .get(`/manifests/${mock.apps[0].uid}/installations`)
          .reply(200, { data: mock.installations })
          .delete(`/installations/${mock.installations[0].uid}`)
          .reply(200, { data: {} })
      )
      .it('should uninstall a stack app', async () => {
        const { stdout } = await runCommand([
          'app:uninstall',
          '--installation-uid',
          mock.installations[0].uid,
        ]);

        expect(stdout).to.contain(
          $t(messages.APP_UNINSTALLED, {
            app: mock.apps[0].name,
          })
        );
      });
  });

  describe('Fail to uninstall an app from a stack', () => {
    fancy
      .stub(cliux, 'inquire', (stub) => 
        stub.callsFake(async (prompt: any) => {
          const responses: Record<string, any> = {
            App: mock.apps[0].name,
            Organization: mock.organizations[0].name,
            appInstallation: mock.installations[0].uid,
          };
          return responses[prompt.name];
        })
      )
      .nock(region.cma, (api) =>
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .get('/manifests?limit=50&asc=name&include_count=true&skip=0')
          .reply(200, { data: mock.apps })
          .get(`/manifests/${mock.apps[0].uid}/installations`)
          .reply(200, { data: mock.installations })
      )
      .nock(`https://${developerHubBaseUrl}`, (api) =>
        api
          .delete(`/installations/wrong-uid`)
          .reply(404, {
            error: 'Not Found',
            message: 'App with id wrong-uid not installed',
          })
      )
      .it('should fail with an error', async () => {
        try {
          await runCommand(['app:uninstall', '--installation-uid', 'wrong-uid']);
        } catch (error) {
          const err = error as { message: string; oclif: { exit: number } };
          expect(err.message).to.contain('App with id wrong-uid not installed');
          expect(err.oclif.exit).to.equal(1);
        }
      });
  });
});
