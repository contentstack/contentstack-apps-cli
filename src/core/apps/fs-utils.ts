import { readFile as fsReadFile, writeFile } from 'node:fs/promises'
import * as AdmZip from 'adm-zip'

import ContentstackError from '../contentstack/error'
import { getErrorMessage } from './app-utils'

export function unzipFile(filePath: string, targetPath: string): void {
  const zip = new AdmZip(filePath)
  zip.extractAllTo(targetPath, true)
}

export async function createFile(
  filePath: string,
  content: string | Buffer
): Promise<void> {
  try {
    await writeFile(filePath, content)
  } catch (error: any) {
    throw new ContentstackError(getErrorMessage('manifest_generation_failure'))
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const fileContent = await fsReadFile(filePath, { encoding: 'utf8' })
    return fileContent
  } catch (error: any) {
    throw new ContentstackError(getErrorMessage('file_operation_failure'))
  }
}
