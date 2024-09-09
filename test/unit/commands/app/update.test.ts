import { join } from 'path';
import { expect } from 'chai';
import { cliux, configHandler } from '@contentstack/cli-utilities';
import { runCommand } from '@oclif/test';
import messages from '../../../../src/messages';
import * as mock from '../../mock/common.mock.json';
import manifestData from '../../config/manifest.json';
import { getDeveloperHubUrl } from '../../../../src/util/inquirer';
import fancy from 'fancy-test';

const region: { cma: string; name: string; cda: string } = configHandler.get('region');
const developerHubBaseUrl = getDeveloperHubUrl();

describe('app:update', () => {
  describe('Update app with `--app-manifest` flag', () => {
    fancy
      .nock(region.cma, api => 
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, api => 
        api
          .get('/manifests/app-uid-1')
          .reply(200, { data: { ...manifestData } })
          .put('/manifests/app-uid-1')
          .reply(200, { data: { ...manifestData } })
      )
      .it('should update an app', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          join(process.cwd(), 'test', 'unit', 'config', 'manifest.json'),
        ]);

        expect(result.stdout).to.contain(messages.APP_UPDATE_SUCCESS);
      });
  });

  describe('Update app with wrong `manifest.json` path', () => {
    fancy
      .stub(cliux, 'inquire', stub =>
        stub.callsFake(async () => 'test-manifest')
      )
      .it('should fail with manifest max retry message', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          'test-manifest',
        ]);
        expect(result.stdout).to.contain(messages.MAX_RETRY_LIMIT_WARN);
      });
  });

  describe('Update app with wrong `app-uid`', () => {
    fancy
      .nock(region.cma, api => 
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, api => 
        api
          .get('/manifests/app-uid-1')
          .reply(200, { data: { uid: 'app-uid-3' } })
          .get('/manifests?limit=50&asc=name&include_count=true&skip=0')
          .reply(200, { data: mock.apps })
      )
      .stub(cliux, 'inquire', stub => 
        stub.callsFake(async () => 'App 2')
      )
      .it('should fail with max retry message', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          join(process.cwd(), 'test', 'unit', 'config', 'manifest.json'),
        ]);

        expect(result.stdout).to.contain('error: marketplaceSdk.marketplace(...).app is not a function\n');
      });
  });

  describe('Update app with wrong `app version`', () => {
    fancy
      .nock(region.cma, api => 
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, api => 
        api
          .get('/manifests/app-uid-1')
          .reply(200, { data: { version: 3, uid: 'app-uid-1' } })
      )
      .it('should fail with version mismatch error message', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          join(process.cwd(), 'test', 'unit', 'config', 'manifest.json'),
        ]);

        expect(result.stdout).to.contain(messages.APP_VERSION_MISS_MATCH);
      });
  });

  describe('Update app with wrong app-uid API failure', () => {
    fancy
      .nock(region.cma, api => 
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, api => 
        api
          .get('/manifests/app-uid-1')
          .reply(200, { data: { ...manifestData, name: 'test-app', version: 1 } })
          .put('/manifests/app-uid-1')
          .reply(400, { data: { ...manifestData, name: 'test-app', version: 1 } })
      )
      .it('update app should fail with 400 status code', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          join(process.cwd(), 'test', 'unit', 'config', 'manifest.json'),
        ]);

        expect(result.stdout).to.contain(messages.INVALID_APP_ID);
      });
  });

  describe('Update app API failure', () => {
    fancy
      .nock(region.cma, api => 
        api
          .get('/v3/organizations?limit=100&asc=name&include_count=true&skip=0')
          .reply(200, { organizations: mock.organizations })
      )
      .nock(`https://${developerHubBaseUrl}`, api => 
        api
          .get('/manifests/app-uid-1')
          .reply(200, { data: { ...manifestData, name: 'test-app', version: 1 } })
          .put('/manifests/app-uid-1')
          .reply(403, { data: { ...manifestData, name: 'test-app', version: 1 } })
      )
      .it('update app should fail with 403 status code', async () => {
        const result = await runCommand([
          'app:update',
          '--app-manifest',
          join(process.cwd(), 'test', 'unit', 'config', 'manifest.json'),
        ]);

        expect(result.stdout).to.contain('"status":403');
      });
  });
});
