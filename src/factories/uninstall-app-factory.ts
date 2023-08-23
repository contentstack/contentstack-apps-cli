import { UninstallApp } from "../interfaces/uninstall-app";
import { UninstallAll } from "../strategies/uninstall-all";
import { UninstallSelected } from "../strategies/uninstall-selected";

export class UninstallAppFactory {
  public getStrategyInstance(uninstallAll: boolean): UninstallApp {
    let strategy: UninstallApp;
    if (uninstallAll) {
      strategy = new UninstallAll()
    } else {
      strategy = new UninstallSelected()
    }
    return strategy
  }
}