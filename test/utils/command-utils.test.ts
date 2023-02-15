import { expect } from 'chai'
import * as sinon from 'sinon'

import { cliux } from '@contentstack/cli-utilities'

import {
  askAppName,
  askAppType,
  askOrgUid,
} from '../../src/core/apps/command-utils'
import { getErrorMessage } from '../../src/core/apps/app-utils'
import { AppType } from '../../src/typings'

const mockData = {
  validAppName: 'sample_app_name',
  invalidAppName: 'KS',
  appType: AppType.STACK,
}

describe('Command utility functions', () => {
  let cliuxInquireStub
  let cliuxErrorStub

  beforeEach(() => {
    cliuxInquireStub = sinon.stub(cliux, 'inquire')
    cliuxErrorStub = sinon.stub(cliux, 'error')
  })

  afterEach(() => {
    cliuxInquireStub.restore()
    cliuxErrorStub.restore()
  })
  it('askAppName should throw an error if an invalid app name was entered and ask again', async () => {
    cliuxInquireStub.onFirstCall().returns(mockData.invalidAppName)
    cliuxInquireStub.returns(mockData.validAppName)
    const appName = await askAppName()
    expect(cliuxErrorStub.calledWith(getErrorMessage('invalid_app_name'))).to.be
      .true
    expect(cliuxInquireStub.calledTwice).to.be.true
    expect(appName).to.equal(mockData.validAppName)
  })

  it('askOrgUid should return a valid app name', async () => {
    cliuxInquireStub.returns(mockData.validAppName)
    const orgUid = await askOrgUid()
    expect(orgUid).to.equal(mockData.validAppName)
  })

  it('askOrgUid should throw an error if an invalid app name was entered and ask again', async () => {
    cliuxInquireStub.onFirstCall().returns(mockData.invalidAppName)
    cliuxInquireStub.returns(mockData.validAppName)
    const orgUid = await askOrgUid()
    expect(cliuxErrorStub.calledWith(getErrorMessage('invalid_org_uid'))).to.be
      .true
    expect(cliuxInquireStub.calledTwice).to.be.true
    expect(orgUid).to.equal(mockData.validAppName)
  })

  it('askAppType should return a valid app type', async () => {
    cliuxInquireStub.returns(mockData.appType)
    const appType = await askAppType()
    expect(appType).to.equal(mockData.appType)
  })
})
