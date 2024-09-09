import { expect } from 'chai';
import fancy from 'fancy-test';
import sinon from 'sinon';
import {
  cliux,
  FlagInput,
  configHandler,
  ContentstackClient,
  managementSDKClient,
} from '@contentstack/cli-utilities';
import * as mock from '../mock/common.mock.json';
import messages, { $t } from '../../../src/messages';
import {
  getOrg,
  getAppName,
  getDirName,
  getDeveloperHubUrl,
} from '../../../src/util';
import * as commonUtils from '../../../src/util/common-utils';
import { join } from 'path';

const region: { cma: string; name: string; cda: string } = configHandler.get('region');

describe('Utility Functions', () => {
  let managementSdk: ContentstackClient;

  before(async () => {
    managementSdk = await managementSDKClient({
      host: region.cma.replace('https://', ''),
    });
  });

  describe('getAppName', () => {
    describe('show prompt to get name from user', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stub(cliux, 'inquire', sinon.stub().resolves('Test name'))
        .it('should return the name provided by the user', async () => {
          const name = await getAppName();
          expect(name).to.equal('Test name');
        });
    });

    describe('Check user input length validation', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stdin('\n')
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit('data', 'Te\n');
          }, 1);
          await getAppName('t1');
        })
        .it('should return validation message for short input', ({ stdout }) => {
          expect(stdout).to.contain($t(messages.INVALID_NAME, { min: '3', max: '20' }));
        });
    });
  });

  describe('getDirName', () => {
    describe('Show prompt to get directory name from user', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stub(cliux, 'inquire', sinon.stub().resolves('test'))
        .it('should return the directory name provided by the user', async () => {
          const path = await getDirName(join(process.cwd(), 'test'));
          expect(path).to.equal(join(process.cwd(), 'test'));
        });
    });

    describe('Check directory length validation', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stdin('\n')
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit('data', 't\n');
          }, 1);
          await getDirName(join(process.cwd(), 't'));
        })
        .it('should return validation message for short input', ({ stdout }) => {
          expect(stdout).to.contain($t(messages.INVALID_NAME, { min: '3', max: '50' }));
        });
    });

    describe('Validate if provided directory exists', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stdin('test\n')
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit('data', 'test\n');
          }, 1);
          await getDirName(join(process.cwd(), 'test'));
        })
        .it('should return validation message if directory already exists', ({ stdout }) => {
          expect(stdout).to.contain(messages.DIR_EXIST);
        });
    });
  });

  describe('getOrg', () => {
    describe('Select an organization from list', () => {
      fancy
        .stub(commonUtils, 'getOrganizations', sinon.stub().resolves(mock.organizations))
        .stub(cliux, 'inquire', sinon.stub().resolves('test org 1'))
        .it('should return the organization UID', async () => {
          const org = await getOrg({} as FlagInput, { log: () => {}, managementSdk });
          expect(org).to.equal(mock.organizations[0].uid);
        });
    });

    describe('Passing wrong organization uid through flag', () => {
      fancy
        .stub(commonUtils, 'getOrganizations', sinon.stub().resolves(mock.organizations))
        .do(async () => {
          try {
            await getOrg({ org: 'test org 3' } as unknown as FlagInput, { log: () => {}, managementSdk });
            throw new Error('Expected error not thrown');
          } catch (err) {
            if (err instanceof Error) {
              expect(err.message).to.contain(messages.ORG_UID_NOT_FOUND);
            } else {
              throw new Error('Caught value is not an instance of Error');
            }
          }
        })
        .it('should fail with error `org uid not found`');
    });
  });

  describe('getDeveloperHubUrl', () => {
    describe('Get developer hub base URL', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stub(configHandler, 'get', sinon.stub().returns({
          cma: 'https://api.example.com',
          name: 'Test',
        }))
        .stub(cliux, 'inquire', sinon.stub().resolves('https://api.example.com'))
        .it('should return the developer hub base URL', () => {
          const url = getDeveloperHubUrl();
          expect(url).to.equal('developerhub-api.example.com');
        });
    });

    describe('Validate marketplace URL if empty', () => {
      fancy
        .stdout({ print: process.env.PRINT === 'true' || false })
        .stub(configHandler, 'get', sinon.stub().returns({
          cma: 'https://dummy.marketplace.com',
          name: 'Test',
        }))
        .stdin('\n')
        .do(async () => {
          setTimeout(() => {
            process.stdin.emit('data', 'dummy.marketplace.com\n');
          }, 1);
          getDeveloperHubUrl();
        })
        .it('should print URL validation message and ask for new input', ({ stdout }) => {
          expect(stdout).to.contain('');
        });
    });
  });
});
