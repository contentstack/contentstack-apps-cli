import { expect, test } from '@oclif/test'
const sinon = require('sinon')

import { configHandler, cliux } from '@contentstack/cli-utilities'

import CMAClient from '../../../src/core/contentstack/client'
import * as projectUtils from '../../../src/core/apps/project-utils'
import * as fileUtils from '../../../src/core/apps/fs-utils'
import * as appUtils from '../../../src/core/apps/app-utils'
import { AppType } from '../../../src/typings'

const mockData = {
  authtoken: 'sample_auth_token',
}

describe('Create App command', () => {
  sinon.stub(configHandler, 'get').returns(mockData.authtoken)
  sinon.stub(projectUtils, 'downloadProject').returns('path/to/file')
  sinon.stub(projectUtils, 'installDependencies').callsFake(() => {})
  sinon
    .stub(CMAClient.prototype, 'createApp')
    .returns({ name: 'sample_app_test', uid: 'sampleAppUid' })
  sinon.stub(fileUtils, 'makeDirectory').callsFake(() => {})
  sinon.stub(fileUtils, 'unzipFileToDirectory').callsFake(() => {})
  sinon.stub(fileUtils, 'createFile').callsFake(() => {})
  sinon.stub(fileUtils, 'changeDirectory').callsFake(() => {})
  sinon.stub(appUtils, 'getQuestionSet').returns({})

  describe('User input prompts', () => {
    const appName = 'sample_app'
    const orgUid = 'sample_org_uid'
    const appType = AppType.STACK

    let inquireStub
    let cliUxStub

    beforeEach(() => {
      inquireStub = sinon.stub(cliux, 'inquire').callsFake((inquire: any) => {
        switch (inquire.name) {
          case 'appName':
            return appName
          case 'orgUid':
            return orgUid
          case 'appType':
            return appType
        }
      })
      cliUxStub = sinon.spy(cliux, 'loader')
    })

    afterEach(() => {
      inquireStub.reset()
      inquireStub.restore()
      cliUxStub.restore()
    })

    test
      .stdout({ print: true })
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
        expect(cliUxStub.firstCall.args[0]).to.equal(
          'Fetching the app template'
        )
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName])
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
        expect(cliUxStub.firstCall.args[0]).to.equal(
          'Fetching the app template'
        )
      })

    test
      .stdout({ print: true })
      .command(['app:create', '-o', orgUid])
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
        expect(cliUxStub.firstCall.args[0]).to.equal(
          'Fetching the app template'
        )
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName, '-o', orgUid])
      .it(
        'should take the default value for app type when not provided in the command',
        () => {
          expect(inquireStub.notCalled).to.be.true
          expect(cliUxStub.firstCall.args[0]).to.equal(
            'Fetching the app template'
          )
        }
      )

    test
      .stdout({ print: true })
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
        expect(cliUxStub.firstCall.args[0]).to.equal(
          'Fetching the app template'
        )
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName, '-o', orgUid, '-i'])
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
        expect(cliUxStub.firstCall.args[0]).to.equal(
          'Fetching the app template'
        )
      })
  })

  describe.skip('Input Field Validations', () => {
    test
      .stdout({ print: true })
      .command(['app:create'])
      .it(
        'should show an error message on entering invalid app name',
        (ctx) => {
          expect(ctx).contain('')
        }
      )
  })
})
