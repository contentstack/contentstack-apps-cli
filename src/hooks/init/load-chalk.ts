import { loadChalk } from "@contentstack/cli-utilities";

/**
 * Ensures the cli-utilities chalk singleton is ready before commands run.
 * Required when this CLI runs standalone (bin/run); when embedded under core csdx, core init also loads chalk.
 */
export default async function loadChalkHook(): Promise<void> {
  await loadChalk();
}
