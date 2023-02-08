import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
const sinon = require('sinon')
import * as path from 'path'

import { configHandler, cliux } from '@contentstack/cli-utilities'

import CMAClient from '../../../src/core/contentstack/client'
import * as projectUtils from '../../../src/core/apps/project-utils'
import * as fileUtils from '../../../src/core/apps/fs-utils'
import { AppType } from '../../../src/typings'
import { getErrorMessage } from '../../../src/core/apps/app-utils'
import ContentstackError from '../../../src/core/contentstack/error'

const mockData = {
  appName: 'sample_app',
  authtoken: 'sample_auth_token',
  invalidAppName: 'KS',
  invalidOrgUid: 'invalid',
  orgUid: 'sample_org_uid',
  appType: AppType.STACK,
  appManifest: {
    name: 'sample_app',
    uid: 'sampleAppUid',
  },
}

describe('Create App command', () => {
  const configHandlerStub = sinon
    .stub(configHandler, 'get')
    .returns(mockData.authtoken)
  const createAppStub = sinon
    .stub(CMAClient.prototype, 'createApp')
    .returns(mockData.appManifest)
  const downloadProjectStub = sinon
    .stub(projectUtils, 'downloadProject')
    .returns('path/to/file')
  const installDepsStub = sinon
    .stub(projectUtils, 'installDependencies')
    .callsFake(() => {})
  sinon.stub(fileUtils, 'makeDirectory').callsFake(() => {})
  const unzipFileStub = sinon
    .stub(fileUtils, 'unzipFileToDirectory')
    .callsFake(() => {})
  const createFileStub = sinon.stub(fileUtils, 'createFile').callsFake(() => {})
  sinon.stub(fileUtils, 'changeDirectory').callsFake(() => {})

  const targetPath = path.join(process.cwd(), mockData.appName)

  describe('User input prompts', () => {
    let inquireStub
    let cliuxSpy

    beforeEach(() => {
      inquireStub = sinon.stub(cliux, 'inquire').callsFake((inquire: any) => {
        switch (inquire.name) {
          case 'appName':
            return mockData.appName
          case 'orgUid':
            return mockData.orgUid
          case 'appType':
            return mockData.appType
        }
      })
      cliuxSpy = sinon.spy(CliUx.ux.action, 'start')
    })

    afterEach(() => {
      inquireStub.restore()
      inquireStub.reset()
      cliuxSpy.restore()
    })

    test
      .stdout()
      .command(['app:create'])
      .it('should prompt the user for inputs when not provided', () => {
        expect(inquireStub.calledThrice).to.be.true
        expect(inquireStub.firstCall.args[0]).to.deep.equal({
          type: 'input',
          message: 'Enter a 3 to 20 character long name for your app',
          name: 'appName',
        })
        expect(inquireStub.secondCall.args[0]).to.deep.equal({
          type: 'input',
          message:
            'Enter the organization uid on which you wish to register the app',
          name: 'orgUid',
        })
        expect(inquireStub.thirdCall.args[0]).to.deep.equal({
          type: 'list',
          message: 'Enter the type of the app, you wish to create',
          name: 'appType',
          choices: [
            { name: AppType.STACK, value: AppType.STACK },
            { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
          ],
        })
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', mockData.appName])
      .it('should not prompt for app name when provided in the command', () => {
        expect(inquireStub.calledTwice).to.be.true
        expect(inquireStub.firstCall.args[0]).to.deep.equal({
          type: 'input',
          message:
            'Enter the organization uid on which you wish to register the app',
          name: 'orgUid',
        })
        expect(inquireStub.secondCall.args[0]).to.deep.equal({
          type: 'list',
          message: 'Enter the type of the app, you wish to create',
          name: 'appType',
          choices: [
            { name: AppType.STACK, value: AppType.STACK },
            { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
          ],
        })
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', '-o', mockData.orgUid])
      .it('should not prompt for org uid when provided in the command', () => {
        expect(inquireStub.calledTwice).to.be.true
        expect(inquireStub.firstCall.args[0]).to.deep.equal({
          type: 'input',
          message: 'Enter a 3 to 20 character long name for your app',
          name: 'appName',
        })
        expect(inquireStub.secondCall.args[0]).to.deep.equal({
          type: 'list',
          message: 'Enter the type of the app, you wish to create',
          name: 'appType',
          choices: [
            { name: AppType.STACK, value: AppType.STACK },
            { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
          ],
        })
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
      .it(
        'should take the default value for app type when not provided in the command',
        () => {
          expect(inquireStub.notCalled).to.be.true
          expect(cliuxSpy.firstCall.args[0]).to.equal(
            'Fetching the app template'
          )
        }
      )

    test
      .stdout()
      .command(['app:create', mockData.invalidAppName])
      .it(
        'should prompt user for app name if a valid app name is not provided in the argument',
        () => {
          expect(inquireStub.calledThrice).to.be.true
          expect(inquireStub.firstCall.args[0]).to.deep.equal({
            type: 'input',
            message: 'Enter a 3 to 20 character long name for your app',
            name: 'appName',
          })
        }
      )

    test
      .stdout()
      .command(['app:create', '-i'])
      .it('should prompt the user for all inputs in interactive mode', () => {
        expect(inquireStub.calledThrice).to.be.true
        expect(inquireStub.firstCall.args[0]).to.deep.equal({
          type: 'input',
          message: 'Enter a 3 to 20 character long name for your app',
          name: 'appName',
        })
        expect(inquireStub.secondCall.args[0]).to.deep.equal({
          type: 'input',
          message:
            'Enter the organization uid on which you wish to register the app',
          name: 'orgUid',
        })
        expect(inquireStub.thirdCall.args[0]).to.deep.equal({
          type: 'list',
          message: 'Enter the type of the app, you wish to create',
          name: 'appType',
          choices: [
            { name: AppType.STACK, value: AppType.STACK },
            { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
          ],
        })
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })

    test
      .stdout()
      .command(['app:create', mockData.appName, '-o', mockData.orgUid, '-i'])
      .it('should disregard any inputs in interactive mode', () => {
        expect(inquireStub.calledThrice).to.be.true
        expect(inquireStub.firstCall.args[0]).to.deep.equal({
          type: 'input',
          message: 'Enter a 3 to 20 character long name for your app',
          name: 'appName',
        })
        expect(inquireStub.secondCall.args[0]).to.deep.equal({
          type: 'input',
          message:
            'Enter the organization uid on which you wish to register the app',
          name: 'orgUid',
        })
        expect(inquireStub.thirdCall.args[0]).to.deep.equal({
          type: 'list',
          message: 'Enter the type of the app, you wish to create',
          name: 'appType',
          choices: [
            { name: AppType.STACK, value: AppType.STACK },
            { name: AppType.ORGANIZATION, value: AppType.ORGANIZATION },
          ],
        })
        expect(cliuxSpy.firstCall.args[0]).to.equal('Fetching the app template')
      })
  })

  describe('User input errors', () => {
    let inquireStub

    beforeEach(() => {
      inquireStub = sinon.stub(cliux, 'inquire')
      inquireStub.callsFake((inquire: any) => {
        switch (inquire.name) {
          case 'appName':
            return mockData.appName
          case 'orgUid':
            return mockData.orgUid
          case 'appType':
            return mockData.appType
        }
      })

      inquireStub.onFirstCall().callsFake((inquire: any) => {
        switch (inquire.name) {
          case 'appName':
            return mockData.invalidAppName
          case 'orgUid':
            return mockData.orgUid
          case 'appType':
            return mockData.appType
        }
      })

      inquireStub.onThirdCall().callsFake((inquire: any) => {
        switch (inquire.name) {
          case 'appName':
            return mockData.appName
          case 'orgUid':
            return mockData.invalidOrgUid
          case 'appType':
            return mockData.appType
        }
      })
    })

    afterEach(() => {
      inquireStub.reset()
      inquireStub.restore()
    })

    test
      .stdout()
      .command(['app:create'])
      .it(
        'should show an error message on entering an invalid app name and ask for app name again',
        (ctx) => {
          expect(ctx.stdout).contain(
            'Please enter a valid name that is 3 to 20 characters long.'
          )
          // Todo: test for ask again
        }
      )

    test
      .stdout()
      .command(['app:create'])
      .it(
        'should show an error message on entering an invalid Org uid and ask for org uid again',
        (ctx) => {
          expect(ctx.stdout).contain('Please enter a valid organization uid.')
          // Todo: test for ask again
        }
      )
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('file_fetching_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if fetching the app template failed')

    test
      .stub(CMAClient.prototype, 'createApp', () => {
        throw new ContentstackError(getErrorMessage('app_creation_failure'))
      })
      .stdout()
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('app_creation_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if registering the app failed')

    test
      .stub(CMAClient.prototype, 'createApp', () => {
        throw new ContentstackError(getErrorMessage('duplicate_app_name'))
      })
      .stdout()
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
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
      .command(['app:create', mockData.appName, '-o', mockData.orgUid])
      .catch((error) => {
        expect(error.message).to.contain(
          getErrorMessage('dependency_installation_failure')
        )
        expect(cliuxSpy.calledWith('Failed')).to.be.true
      })
      .it('should inform the user if installing the dependencies failed')
  })
})
