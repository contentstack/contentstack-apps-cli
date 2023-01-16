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
  try {
    shell.cd(filePath)
    if (shell.which('npm')) {
      // ? Install Deps using npm
      await new Promise<void>((resolve, reject) => {
        shell.exec('npm install', { silent: true }, (error) => {
          if (error !== 0) {
            return reject(error)
          }
          resolve()
        })
      })
    } else if (shell.which('yarn')) {
      // ? Install Deps using yarn
      await new Promise<void>((resolve, reject) => {
        shell.exec('yarn install', { silent: true }, (error) => {
          if (error !== 0) {
            return reject(error)
          }
          resolve()
        })
      })
    } else {
      throw new Error('no_package_managers')
    }
  } catch (error: any) {
    if (error?.message === 'no_package_managers') {
      throw new ContentstackError(getErrorMessage('no_package_managers'))
    }
    throw new ContentstackError(
      getErrorMessage('dependency_installation_failure')
    )
  }
}
