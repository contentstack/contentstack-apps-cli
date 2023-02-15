import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'

import * as sinon from 'sinon'
import * as path from 'path'

import { configHandler, cliux } from '@contentstack/cli-utilities'

import DeveloperHubClient from '../../../src/core/contentstack/client'
import * as projectUtils from '../../../src/core/apps/project-utils'
import * as fileUtils from '../../../src/core/apps/fs-utils'
import * as commandUtils from '../../../src/core/apps/command-utils'
import { AppType } from '../../../src/typings'
import { getErrorMessage } from '../../../src/core/apps/app-utils'
import ContentstackError from '../../../src/core/contentstack/error'

const mockData = {
  appManifest: {
    name: 'sample_app',
    uid: 'sampleAppUid',
  },
  appName: 'sample_app',
  appType: AppType.STACK,
  authtoken: 'sample_auth_token',
  invalidAppName: 'KS',
  invalidOrgUid: 'invalid',
  orgName: 'sample Org 1',
  orgList: [
    {
      name: 'sample Org 1',
      uid: 'sample-org-1',
    },
    {
      name: 'sample Org 2',
      uid: 'sample-org-2',
    },
    {
      name: 'sample Org 3',
      uid: 'sample-org-3',
    },
  ],
  orgUid: 'sample_org_uid',
}

describe('Create App command', () => {
  let changeDirectoryStub
  let configHandlerStub
  let createAppStub
  let createFileStub
  let downloadProjectStub
  let installDepsStub
  let makeDirectoryStub
  let unzipFileStub

  const targetPath = path.join(process.cwd(), mockData.appName)

  before(() => {
    configHandlerStub = sinon
      .stub(configHandler, 'get')
      .returns(mockData.authtoken)
    createAppStub = sinon
      .stub(DeveloperHubClient.prototype, 'createApp')
      .returns(Promise.resolve(mockData.appManifest) as any)
    downloadProjectStub = sinon
      .stub(projectUtils, 'downloadProject')
      .returns(Promise.resolve('path/to/file'))
    installDepsStub = sinon
      .stub(projectUtils, 'installDependencies')
      .callsFake(() => Promise.resolve())
    makeDirectoryStub = sinon
      .stub(fileUtils, 'makeDirectory')
      .callsFake(() => Promise.resolve(''))
    unzipFileStub = sinon
      .stub(fileUtils, 'unzipFileToDirectory')
      .callsFake(() => Promise.resolve())
    createFileStub = sinon
      .stub(fileUtils, 'createFile')
      .callsFake(() => Promise.resolve())
    changeDirectoryStub = sinon
      .stub(fileUtils, 'changeDirectory')
      .callsFake(() => {})
  })

  after(() => {
    changeDirectoryStub.restore()
    configHandlerStub.restore()
    createAppStub.restore()
    createFileStub.restore()
    downloadProjectStub.restore()
    installDepsStub.restore()
    makeDirectoryStub.restore()
    unzipFileStub.restore()
  })

  describe('User input prompts', () => {
    let cliuxSpy

    let getOrganizationStub
    let askAppNameStub
    let askAppTypeStub

    beforeEach(() => {
      askAppNameStub = sinon
        .stub(commandUtils, 'askAppName')
        .returns(Promise.resolve(mockData.appName))
      askAppTypeStub = sinon
        .stub(commandUtils, 'askAppType')
        .returns(Promise.resolve(mockData.appType))
      getOrganizationStub = sinon
        .stub(commandUtils, 'getOrganizationChoice')
        .returns(Promise.resolve(mockData.orgUid))
      cliuxSpy = sinon.spy(CliUx.ux.action, 'start')
    })

    afterEach(() => {
      cliuxSpy.restore()
      askAppNameStub.restore()
      askAppTypeStub.restore()
      getOrganizationStub.restore()
    })

    test
      .stdout()
      .command(['app:create'])
      .it('should prompt the user for all 3 inputs when not provided', () => {
        expect(askAppNameStub.calledOnce).to.be.true
        expect(getOrganizationStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it(
        'should not prompt the user for any inputs when provided in the command',
        () => {
          expect(askAppNameStub.notCalled).to.be.true
          expect(getOrganizationStub.notCalled).to.be.true
          expect(askAppTypeStub.notCalled).to.be.true
          expect(cliuxSpy.firstCall.args[0]).to.equal(
            'Fetching the app template'
          )
        }
      )

    test
      .stdout()
      .command(['app:create', '--name', mockData.appName])
      .it('should not prompt for app name when provided in the command', () => {
        expect(askAppNameStub.notCalled).to.be.true
        expect(getOrganizationStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName])
      .it('should accept app name when provided with short hand flag', () => {
        expect(askAppNameStub.notCalled).to.be.true
        expect(getOrganizationStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', '--org', mockData.orgUid])
      .it('should not prompt for org uid when provided in the command', () => {
        expect(askAppNameStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(getOrganizationStub.notCalled).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it(
        'should take the default value for app type when not provided in the command',
        () => {
          expect(askAppTypeStub.notCalled).to.be.true
          expect(cliuxSpy.firstCall.args[0]).to.equal(
            'Fetching the app template'
          )
        }
      )

    test
      .stdout()
      .command(['app:create', '-n', mockData.invalidAppName])
      .it(
        'should prompt user for app name if a valid app name is not provided in the argument',
        () => {
          expect(askAppNameStub.calledOnce).to.be.true
        }
      )

    test
      .stdout()
      .command(['app:create', '--interactive'])
      .it('should prompt the user for all inputs in interactive mode', () => {
        expect(askAppNameStub.calledOnce).to.be.true
        expect(getOrganizationStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command([
        'app:create',
        '-n',
        mockData.appName,
        '--org',
        mockData.orgUid,
        '--interactive',
      ])
      .it('should disregard any inputs in interactive mode', () => {
        expect(askAppNameStub.calledOnce).to.be.true
        expect(getOrganizationStub.calledOnce).to.be.true
        expect(askAppTypeStub.calledOnce).to.be.true
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })
  })

  describe('App creation tests', () => {
    let cliuxStartSpy
    let cliuxStopSpy
    let cliuxSuccessSpy

    beforeEach(() => {
      cliuxStartSpy = sinon.spy(CliUx.ux.action, 'start')
      cliuxStopSpy = sinon.spy(CliUx.ux.action, 'stop')
      cliuxSuccessSpy = sinon.spy(cliux, 'success')
    })

    afterEach(() => {
      cliuxStartSpy.restore()
      cliuxStopSpy.restore()
      cliuxSuccessSpy.restore()
    })

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it(
        'should fetch the app template and unzip it on providing valid inputs',
        () => {
          expect(configHandlerStub.called).to.be.true
          expect(downloadProjectStub.called).to.be.true
          expect(unzipFileStub.called).to.be.true
          expect(cliuxStartSpy.calledWith('Fetching the app template')).to.be
            .true
          expect(cliuxStopSpy.called).to.be.true
        }
      )

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it(
        'should register the app on Developer Hub on providing valid inputs',
        () => {
          expect(createAppStub.called).to.be.true
          expect(createFileStub.called).to.be.true
          expect(
            cliuxStartSpy.calledWith(
              `Registering the app with name ${mockData.appName} on Developer Hub`
            )
          ).to.be.true
          expect(cliuxStopSpy.called).to.be.true
        }
      )

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it(
        'should install dependencies in the target path on providing valid inputs',
        () => {
          expect(installDepsStub.called).to.be.true
          expect(installDepsStub.calledWith(targetPath)).to.be.true
          expect(cliuxStartSpy.calledWith('Installing dependencies')).to.be.true
          expect(cliuxStopSpy.called).to.be.true
        }
      )

    test
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .it('should sucessfully create an app on providing valid inputs', () => {
        expect(cliuxSuccessSpy.calledWith('App creation successful!!')).to.be
          .true
      })
  })

  describe('Error handling', () => {
    let cliuxSpy

    beforeEach(() => {
      cliuxSpy = sinon.spy(CliUx.ux.action, 'stop')
    })

    afterEach(() => {
      cliuxSpy.restore()
    })

    test
      .stub(configHandler, 'get', () => false)
      .stdout()
      .command(['app:create'])
      .catch((error) => {
        expect(error.message).to.contain('You need to login, first.')
      })
      .it('should deny user from creating an app if not logged in')

    test
      .stub(projectUtils, 'downloadProject', () => {
        throw new ContentstackError(getErrorMessage('file_fetching_failure'))
      })
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('file_fetching_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if fetching the app template failed')

    test
      .stub(DeveloperHubClient.prototype, 'createApp', () => {
        throw new ContentstackError(getErrorMessage('app_creation_failure'))
      })
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('app_creation_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if registering the app failed')

    test
      .stub(DeveloperHubClient.prototype, 'createApp', () => {
        throw new ContentstackError(getErrorMessage('duplicate_app_name'))
      })
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(getErrorMessage('duplicate_app_name'))
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if an app with the same name already exists')

    test
      .stub(projectUtils, 'installDependencies', () => {
        throw new ContentstackError(getErrorMessage('no_package_managers'))
      })
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(getErrorMessage('no_package_managers'))
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if no package managers found')

    test
      .stub(projectUtils, 'installDependencies', () => {
        throw new ContentstackError(
          getErrorMessage('dependency_installation_failure')
        )
      })
      .stdout()
      .command(['app:create', '-n', mockData.appName, '--org', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('dependency_installation_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if installing the dependencies failed')
  })
})
