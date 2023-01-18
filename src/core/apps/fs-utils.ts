import { readFile as fsReadFile, writeFile, mkdir } from 'node:fs/promises'
import { chdir } from 'node:process'
import * as AdmZip from 'adm-zip'

import ContentstackError from '../contentstack/error'
import { getErrorMessage } from './app-utils'

export async function unzipFileToDirectory(
  filePath: string,
  targetPath: string,
  errorKey?: string
): Promise<void> {
  try {
    const zip = new AdmZip(filePath)
    const newZip = new AdmZip()
    const entries = zip.getEntries()
    entries.forEach(function (zipEntry) {
      const fileName = zipEntry.entryName
      const newFileName = fileName.substring(fileName.indexOf('/') + 1)
      const fileContent = zipEntry.getData()
      newZip.addFile(newFileName, fileContent, '')
    })
    newZip.extractAllTo(targetPath, true)
  } catch {
    if (errorKey) {
      throw new ContentstackError(getErrorMessage(errorKey))
    }
    throw new ContentstackError(getErrorMessage('file_operation_failure'))
  }
}

export async function makeDirectory(directory: string, errorKey?: string) {
  try {
    const dir = await mkdir(directory, { recursive: true })
    return dir
  } catch (error) {
    if (errorKey) {
      throw new ContentstackError(getErrorMessage(errorKey))
    }
    throw new ContentstackError(getErrorMessage('file_operation_failure'))
  }
}

export async function createFile(
  filePath: string,
  content: string | Buffer,
  errorKey?: string
): Promise<void> {
  try {
    await writeFile(filePath, content)
  } catch (error: any) {
    if (errorKey) {
      throw new ContentstackError(getErrorMessage(errorKey))
    }
    throw new ContentstackError(getErrorMessage('file_operation_failure'))
  }
}

export async function readFile(
  filePath: string,
  errorKey?: string
): Promise<string> {
  try {
    const fileContent = await fsReadFile(filePath, { encoding: 'utf8' })
    return fileContent
  } catch (error: any) {
    if (errorKey) {
      throw new ContentstackError(getErrorMessage(errorKey))
    }
    throw new ContentstackError(getErrorMessage('file_operation_failure'))
  }
}

export function changeDirectory(directory: string, errorKey?: string) {
  try {
    chdir(directory)
  } catch (err) {
    if (errorKey) {
      throw new ContentstackError(getErrorMessage(errorKey))
    }
    throw new ContentstackError(getErrorMessage('directory_change_failure'))
  }
}
