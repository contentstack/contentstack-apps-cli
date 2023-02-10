import { expect } from 'chai'
const AdmZip = require('adm-zip')
import * as fs from 'node:fs/promises'
import * as sinon from 'sinon'

import { getErrorMessage } from '../../src/core/apps/app-utils'

import {
  createFile,
  makeDirectory,
  unzipFileToDirectory,
} from '../../src/core/apps/fs-utils'

const mockData = {
  content: 'sample content',
  errorKey: 'file_generation_failure',
  genericErrorKey: 'file_operation_failure',
  filePath: 'sample/path',
  targetPath: 'sample/path',
}

describe.skip('unzipFileToDirectory', () => {
  let sandbox: sinon.SinonSandbox
  let admZipStub: sinon.SinonStub
  let getEntriesStub: sinon.SinonStub
  let addFileStub: sinon.SinonStub
  let extractAllToStub: sinon.SinonStub
  let entries: any

  beforeEach(() => {
    // sandbox = sinon.createSandbox()

    admZipStub = sinon.stub(AdmZip.prototype, 'constructor')
    getEntriesStub = sinon.stub().returns([])
    addFileStub = sinon.stub().callsFake(() => {})
    extractAllToStub = sinon.stub().callsFake(() => {})
    admZipStub.returns({
      getEntries: getEntriesStub,
      addFile: addFileStub,
      extractAllTo: extractAllToStub,
    })
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should unzip the file to the specified directory', async () => {
    entries = [
      {
        entryName: 'path/to/file1.txt',
        getData: sandbox.stub().returns('file1 content'),
      },
      {
        entryName: 'path/to/file2.txt',
        getData: sandbox.stub().returns('file2 content'),
      },
    ]

    await unzipFileToDirectory('file.zip', 'target/path')

    expect(admZipStub.calledWith('file.zip')).to.be.true
    expect(getEntriesStub.calledOnce).to.be.true
    // expect(addFileStub.calledWith('file1.txt', 'file1 content', '')).to.be.true
    // expect(addFileStub.calledWith('file2.txt', 'file2 content', '')).to.be.true
    expect(extractAllToStub.calledWith('target/path', true)).to.be.true
  })

  it.skip('should throw an error with the specified errorKey', async () => {
    const error = new Error('error')
    admZipStub.throws(error)

    try {
      await unzipFileToDirectory('file.zip', 'target/path', 'custom_error')
      throw new Error('unzipFileToDirectory should have thrown an error')
    } catch (e) {
      expect(e.message).to.equal(getErrorMessage('custom_error'))
    }
  })
})

describe('makeDirectory', () => {
  let mkdirStub

  beforeEach(() => {
    mkdirStub = sinon.stub(fs, 'mkdir')
  })

  afterEach(() => {
    mkdirStub.restore()
  })

  it('makeDirectory should create a directory', async () => {
    const result = await makeDirectory(mockData.filePath)
    expect(result).to.be.undefined
    expect(mkdirStub.calledOnce).to.be.true
  })

  it('makeDirectory should throw an error with the key "file_operation_failure"', async () => {
    mkdirStub.throws(new Error())
    try {
      await makeDirectory(mockData.filePath)
    } catch (error) {
      expect(mkdirStub.calledOnce).to.be.true
      expect(error.message).to.equal(getErrorMessage(mockData.genericErrorKey))
    }
  })

  it('createFile should throw an error with the errokey provided as an argument', async () => {
    mkdirStub.throws(new Error())
    try {
      await makeDirectory(mockData.filePath, mockData.errorKey)
    } catch (error) {
      expect(mkdirStub.calledOnce).to.be.true
      expect(error.message).to.equal(getErrorMessage(mockData.errorKey))
    }
  })
})

describe('createFile', () => {
  let writeFileStub

  beforeEach(() => {
    writeFileStub = sinon.stub(fs, 'writeFile')
  })

  afterEach(() => {
    writeFileStub.restore()
  })

  it('createFile should create a new file', async () => {
    const result = await createFile(mockData.filePath, mockData.content)
    expect(result).to.be.undefined
    expect(writeFileStub.calledOnce).to.be.true
  })

  it('createFile should throw an error with the key "file_operation_failure"', async () => {
    writeFileStub.throws(new Error())
    try {
      await createFile(mockData.filePath, mockData.content)
    } catch (error) {
      expect(writeFileStub.calledOnce).to.be.true
      expect(error.message).to.equal(getErrorMessage(mockData.genericErrorKey))
    }
  })

  it('createFile should throw an error with the errokey provided as an argument', async () => {
    writeFileStub.throws(new Error())
    try {
      await createFile(mockData.filePath, mockData.content, mockData.errorKey)
    } catch (error) {
      expect(writeFileStub.calledOnce).to.be.true
      expect(error.message).to.equal(getErrorMessage(mockData.errorKey))
    }
  })
})

// Todo: Add test cases for changeDirectory
