import axios from 'axios'
import { createWriteStream } from 'node:fs'
import ContentstackError from '../contentstack/error'

export async function downloadProject(
  projectUrl: string,
  filePath: string
): Promise<ContentstackError | undefined> {
  try {
    const writer = createWriteStream(filePath)
    const response = await axios.get(projectUrl, {
      method: 'GET',
      responseType: 'stream',
    })
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  } catch (error: any) {
    // Add an error code to identify failure
    throw new ContentstackError(error.message, 401)
  }
}
