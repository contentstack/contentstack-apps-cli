import { ContentstackClient, FlagInput } from "@contentstack/cli-utilities";
import { CommonOptions } from "../util";
import { AppTarget } from "@contentstack/management/types/app/index"

export interface UninstallApp {
  run(flags: FlagInput, org: string, managementSdk: ContentstackClient, options: CommonOptions, appType: AppTarget): Promise<void>;
}