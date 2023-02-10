import { expect } from 'chai'
import * as sinon from 'sinon'

import { cliux } from '@contentstack/cli-utilities'

import {
  deriveAppManifestFromSDKResponse,
  getOrgAppUiLocation,
  getErrorMessage,
  validateAppName,
  validateOrgUid,
  askAppName,
  askAppType,
  askOrgUid,
} from '../../src/core/apps/app-utils'
import { AppLocation, AppType } from '../../src/typings'
import * as errors from '../../src/core/apps/errors.json'

const mockData = {
  appResponse: {
    urlPath: '/apps/***REMOVED***',
    params: { organization_uid: 'bltb00c436e709d1864' },
    name: 'sample_app_name',
    uid: 'sample_app_uid',
    description: 'sample app description',
    visibility: 'private',
    created_by: {
      uid: 'sample_user_uid',
      first_name: 'John',
      last_name: 'Doe',
    },
    updated_by: {
      uid: 'sample_user_uid',
      first_name: 'John',
      last_name: 'Doe',
    },
    organization_uid: 'sample_org_uid',
  },
  manifest: {
    name: 'sample_app_name',
    uid: 'sample_app_uid',
    description: 'sample app description',
    visibility: 'private',
    created_by: {
      uid: 'sample_user_uid',
      first_name: 'John',
      last_name: 'Doe',
    },
    updated_by: {
      uid: 'sample_user_uid',
      first_name: 'John',
      last_name: 'Doe',
    },
    organization_uid: 'sample_org_uid',
  },
  orgAppLocation: [
    {
      type: AppLocation.ORG_CONFIG,
      meta: [
        {
          path: '/app-configuration',
          signed: true,
          enabled: true,
        },
      ],
    },
  ],
  errorKey: 'app_creation_failure',
  validAppName: 'sample_app_name',
  invalidAppName: 'KS',
  invalidLongAppName: 'sample_relly_long_app_name',
  validOrgUid: 'sample_org_uid',
  invalidOrgUid: 'invalid',
  appType: AppType.STACK,
}

describe.skip('App utility functions', () => {
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

  it('deriveAppManifestFromSDKResponse should return only the properties of app manifest', () => {
    const manifest = deriveAppManifestFromSDKResponse(mockData.appResponse)
    expect(manifest).to.deep.equal(mockData.manifest)
  })

  it("getOrgAppUiLocation should return Org App's UI Locations", () => {
    const orgAppLocation = getOrgAppUiLocation()
    expect(orgAppLocation).to.deep.equal(mockData.orgAppLocation)
  })

  it('getErrorMessage should retrive the correct error message', () => {
    const errorMessage = getErrorMessage(mockData.errorKey)
    expect(errorMessage).to.be.equal(errors[mockData.errorKey])
  })

  it('validateAppName should return true for valid app names', () => {
    const isValid = validateAppName(mockData.validAppName)
    expect(isValid).to.be.true
  })

  it('validateAppName should return false for invalid app names', () => {
    const isValid = validateAppName(mockData.invalidAppName)
    expect(isValid).to.be.false
  })

  it('validateAppName should return false for app names longer than 20 chars', () => {
    const isValid = validateAppName(mockData.invalidLongAppName)
    expect(isValid).to.be.false
  })

  it('validateOrgUid should return true for valid app names', () => {
    const isValid = validateOrgUid(mockData.validOrgUid)
    expect(isValid).to.be.true
  })

  it('validateOrgUid should return false for invalid app names', () => {
    const isValid = validateOrgUid(mockData.invalidOrgUid)
    expect(isValid).to.be.false
  })

  it('askAppName should return a valid app name', async () => {
    cliuxInquireStub.returns(mockData.validAppName)
    const appName = await askAppName()
    expect(appName).to.equal(mockData.validAppName)
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
