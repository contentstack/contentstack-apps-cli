import { existsSync, readdirSync, writeFileSync } from "fs";

export function getDirectories(source: string): string[] | [] {
  if (!existsSync(source)) return [];
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

export async function getFileList(
  dirName: string,
  onlyName = true,
  rootFiles = false
): Promise<string[] | []> {
  if (!existsSync(dirName)) return [];

  let files: any = [];
  const items = readdirSync(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory() && !rootFiles) {
      /* eslint-disable no-await-in-loop */
      files = [...files, ...(await getFileList(`${dirName}/${item.name}`))];
    } else {
      files.push(onlyName ? item.name : `${dirName}/${item.name}`);
    }
  }

  return files;
}

export function writeFile(source: string, data: object | string) {
  if (existsSync(source)) {
    // this file already exists, do you want to overwrite it?
    // if yes then overwrite. if no then exit?
  }
  writeFileSync(source, JSON.stringify(data))
}