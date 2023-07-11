import { existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import config from "../config";
import messages, {$t} from "../messages";
import { LogFn } from "../types";
import { cliux } from "@contentstack/cli-utilities";

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

export async function writeFile(dir: string='.', force: boolean=false, data: Record<string, any> | undefined={}, log: LogFn=console.log) {
  await ensureDirectoryExists(dir)
  const files = readdirSync(dir)
  const latestFileName = files.filter(fileName => fileName.match(new RegExp(config.defaultAppFileName))).pop()?.split('.')[0] || config.defaultAppFileName;
  let target = resolve(dir, `${latestFileName}.json`)
  if (existsSync(target)) {
    const userConfirmation: boolean = force || (await cliux.confirm($t(messages.FILE_ALREADY_EXISTS, { file: `${config.defaultAppFileName}.json` })))
    if (userConfirmation) {
      target = resolve(dir, `${incrementName(latestFileName)}.json`);
    } else {
      target = resolve(dir, `${config.defaultAppFileName}.json`);
    }
  }
  await writeFileSync(target, JSON.stringify(data))
  log($t(messages.FILE_WRITTEN_SUCCESS, { file: target }), "info")
}

async function ensureDirectoryExists(dir: string) {
  if (!existsSync(dir)) {
    await mkdirSync(dir, {recursive: true})
  }
}

function incrementName(name: string) {
  return `${config.defaultAppFileName}${Number(name.split(config.defaultAppFileName).pop())+1}`
}