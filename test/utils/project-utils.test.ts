import { expect } from 'chai'
import axios from 'axios'
import * as sinon from 'sinon'
import * as shell from 'shelljs'
import * as tmp from 'tmp'
import * as fs from 'node:fs'

import {
  downloadProject,
  installDependencies,
} from '../../src/core/apps/project-utils'
import { getErrorMessage } from '../../src/core/apps/app-utils'

const mockData = {
  filePath: 'fake/filepath',
  projectURL: 'https://www.example.com',
  requestHeader: {
    method: 'GET',
    responseType: 'stream',
  },
  packagePath: 'fake/path/to/npm',
  fileDetails: {
    name: 'fake/filepath',
  },
  axiosResponse: { data: { pipe: () => {} } },
}

describe('downloadProject', () => {
  let axiosStub
  let tmpStub
  let writeStreamStub

  let shellWhichStub
  let shellExecStub

  beforeEach(() => {
    axiosStub = sinon.stub(axios, 'get').resolves(mockData.axiosResponse)
    tmpStub = sinon.stub(tmp, 'fileSync').returns(mockData.fileDetails as any)
    writeStreamStub = sinon.stub(fs, 'createWriteStream').returns({
      on: (event, cb) => {
        if (event === 'finish') {
          cb()
        }
      },
    } as any)

    shellExecStub = sinon.stub(shell, 'exec')
    shellWhichStub = sinon.stub(shell, 'which')
    shellWhichStub.withArgs('npm').returns(mockData.packagePath as any)
  })

  afterEach(() => {
    axiosStub.restore()
    tmpStub.restore()
    writeStreamStub.restore()
    shellWhichStub.restore()
    shellExecStub.restore()
  })

  it('should create a temporary location to save the file', async () => {
    const result = await downloadProject(mockData.projectURL)
    expect(tmpStub.calledOnce).to.be.true
    expect(writeStreamStub.calledWith(mockData.fileDetails.name)).to.be.true
    expect(result).to.equal(mockData.filePath)
  })

  it('should make a call to fetch the marketplace app template', async () => {
    await downloadProject(mockData.projectURL)
    expect(axiosStub.calledOnce).to.be.true
    expect(axiosStub.calledWith(mockData.projectURL, mockData.requestHeader)).to
      .be.true
  })

  it('should throw error if file generation fails', async () => {
    writeStreamStub.returns({
      on: (event, cb) => {
        if (event === 'error') {
          cb()
        }
      },
    })

    try {
      await downloadProject(mockData.projectURL)
    } catch (error) {
      console.log('ERROR: SOME ER')
      expect(error.message).to.equal(getErrorMessage('file_generation_failure'))
    }
    expect(writeStreamStub.calledWith(mockData.fileDetails.name)).to.be.true
  })

  it('should throw error if file fetching fails', async () => {
    axiosStub.rejects()
    try {
      await downloadProject(mockData.projectURL)
    } catch (error) {
      console.log('ERROR: AXIOS ER')
      expect(axiosStub.calledWith(mockData.projectURL, mockData.requestHeader))
        .to.be.true
      expect(error.message).to.equal(getErrorMessage('file_fetching_failure'))
    }
  })
})

describe('installDependencies', () => {
  let shellCdStub
  let shellExecStub
  let shellWhichStub

  beforeEach(() => {
    shellCdStub = sinon.stub(shell, 'cd')
    shellExecStub = sinon.stub(shell, 'exec')
    shellWhichStub = sinon.stub(shell, 'which')

    shellExecStub.callsFake((_, __, cb) => {
      cb(0)
    })
  })

  afterEach(() => {
    shellCdStub.restore()
    shellWhichStub.restore()
    shellExecStub.restore()
  })

  it('should install dependencies using npm if it is available and return undefined', async () => {
    shellWhichStub.withArgs('npm').returns(mockData.packagePath)
    const result = await installDependencies(mockData.filePath)
    expect(shellCdStub.calledOnce).to.be.true
    expect(shellWhichStub.calledWith('npm')).to.be.true
    expect(shellExecStub.calledOnce).to.be.true
    expect(shellExecStub.args[0][0]).to.equal('npm install')
    expect(result).to.be.undefined
  })

  it('should install dependencies using yarn if it is available and return undefined', async () => {
    shellWhichStub.withArgs('yarn').returns(mockData.packagePath)
    const result = await installDependencies(mockData.filePath)
    expect(shellCdStub.calledOnce).to.be.true
    expect(shellWhichStub.calledWith('yarn')).to.be.true
    expect(shellExecStub.calledOnce).to.be.true
    expect(shellExecStub.args[0][0]).to.equal('yarn install')
    expect(result).to.be.undefined
  })

  it('should throw error if no package manager is available', async () => {
    shellWhichStub.returns(false)
    try {
      await installDependencies(mockData.filePath)
    } catch (error) {
      expect(error.message).to.contain(getErrorMessage('no_package_managers'))
    }
  })

  it('should throw error if dependency installation fails', async () => {
    shellWhichStub.returns(mockData.packagePath)
    shellExecStub.callsFake((_, __, cb) => {
      cb(1)
    })

    try {
      await installDependencies(mockData.filePath)
    } catch (error) {
      expect(error.message).to.contain(
        getErrorMessage('dependency_installation_failure')
      )
    }
  })
})
