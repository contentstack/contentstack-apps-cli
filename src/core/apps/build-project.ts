import axios from 'axios'
import * as tmp from 'tmp'
import { createWriteStream } from 'node:fs'
import ContentstackError from '../contentstack/error'

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
      writer.on('error', reject)
    })
  } catch (error: any) {
    // Add an error code to identify failure
    throw new ContentstackError(error.message, 401)
  }
}
