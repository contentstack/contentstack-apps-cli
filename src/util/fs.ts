import { existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import config from "../config";
import messages, {$t} from "../messages";
import { LogFn } from "../types";
import { cliux } from "@contentstack/cli-utilities";

export async function writeFile(dir: string=process.cwd(), force: boolean=false, data: Record<string, any> | undefined={}, log: LogFn=console.log) {
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