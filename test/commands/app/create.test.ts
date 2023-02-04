import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
const sinon = require('sinon')
const inquirer = require('inquirer')

import * as projectUtils from '../../../src/core/apps/build-project'
import * as fileUtils from '../../../src/core/apps/fs-utils'
import * as appUtils from '../../../src/core/apps/app-utils'
import { AppType } from '../../../src/typings'
import CMAClient from '../../../src/core/contentstack/client'

describe('Create App command', () => {
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

  describe('command prompts', () => {
    const appName = 'sample_app'
    const orgUid = 'sample_org_uid'
    const appType = AppType.STACK

    let inquirerStub
    let cliUxStub

    beforeEach(() => {
      inquirerStub = sinon.stub().returns({
        appName,
        orgUid,
        appType,
      })
      sinon.stub(inquirer, 'prompt').callsFake(inquirerStub)
      cliUxStub = sinon.spy(CliUx.ux.action, 'start')
    })

    afterEach(() => {
      inquirer.prompt.restore()
      cliUxStub.restore()
    })

    test
      .stdout({ print: true })
      .command(['app:create'])
      .it('should prompt for user inputs when not provided', () => {
        // Todo: Check for the prompt in console
        expect(inquirerStub.calledOnce).to.be.true
        expect(
          inquirerStub.calledWith(
            {},
            {
              appName: undefined,
              orgUid: undefined,
              appType: undefined,
            }
          )
        ).to.be.true
        expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName])
      .it('should not prompt for app name when provided in the command', () => {
        expect(inquirerStub.calledOnce).to.be.true
        expect(
          inquirerStub.calledWith(
            {},
            {
              appName: appName,
              orgUid: undefined,
              appType: undefined,
            }
          )
        ).to.be.true
        expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
      })

    test
      .stdout({ print: true })
      .command(['app:create', '-o', orgUid])
      .it('should not prompt for org uid when provided in the command', () => {
        expect(inquirerStub.calledOnce).to.be.true
        expect(
          inquirerStub.calledWith(
            {},
            {
              appName: undefined,
              orgUid: orgUid,
              appType: undefined,
            }
          )
        ).to.be.true
        expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName, '-o', orgUid])
      .it(
        'should take the default value for app type when not provided in the command',
        () => {
          expect(inquirerStub.calledOnce).to.be.true
          expect(
            inquirerStub.calledWith(
              {},
              {
                appName: appName,
                orgUid: orgUid,
                appType: appType,
              }
            )
          ).to.be.true
          expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
        }
      )

    test
      .stdout({ print: true })
      .command(['app:create', '-i'])
      .it('should prompt the user for all inputs in interactive mode', () => {
        expect(inquirerStub.calledOnce).to.be.true
        expect(
          inquirerStub.calledWith(
            {},
            {
              appName: undefined,
              orgUid: undefined,
              appType: undefined,
            }
          )
        ).to.be.true
        expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
      })

    test
      .stdout({ print: true })
      .command(['app:create', appName, '-o', orgUid, '-i'])
      .it('should disregard any inputs in interactive mode', () => {
        expect(inquirerStub.calledOnce).to.be.true
        expect(
          inquirerStub.calledWith(
            {},
            {
              appName: undefined,
              orgUid: undefined,
              appType: undefined,
            }
          )
        ).to.be.true
        expect(cliUxStub.calledWith('Fetching the app template')).to.be.true
      })
  })
})
