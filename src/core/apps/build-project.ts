import axios from 'axios'
import * as shell from 'shelljs'
import * as tmp from 'tmp'
import { createWriteStream } from 'node:fs'

import ContentstackError from '../contentstack/error'
import { getErrorMessage } from './app-utils'

export async function downloadProject(projectUrl: string): Promise<any> {
  try {
    const fileDetails = tmp.fileSync()
    const filePath = fileDetails.name
    const writer = createWriteStream(filePath)
    const response = await axios.get(projectUrl, {
      method: 'GET',
      responseType: 'stream',
    })
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', function () {
        resolve(filePath)
      })
      writer.on('error', function () {
        reject(
          new ContentstackError(getErrorMessage('file_generation_failure'))
        )
      })
    })
  } catch (error: any) {
    throw new ContentstackError(getErrorMessage('file_fetching_failure'))
  }
}

export async function installDependencies(filePath: string) {
  shell.cd(filePath)
  if (shell.which('npm')) {
    // ? Install Deps using npm
    shell.exec('npm i', { silent: true })
  } else if (shell.which('yarn')) {
    // ? Install Deps using yarn
    shell.exec('yarn install', { silent: true })
  } else {
    throw new ContentstackError('No package managers found, exiting')
  }
}
