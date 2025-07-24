import { configHandler } from "@contentstack/cli-utilities";
import sinon from "sinon";

/**
 * Helper function to stub authentication for tests
 * This centralizes the common authentication stubbing logic used across test files
 *
 * @param sandbox - The sinon sandbox instance
 */
export function stubAuthentication(sandbox: sinon.SinonSandbox): void {
  // Stub authentication
  sandbox.stub(configHandler, "get").callsFake((key: string) => {
    if (key === "region") {
      return {
        cma: "https://api.contentstack.io",
        cda: "https://cdn.contentstack.io",
        region: "us",
      };
    }
    if (key === "authtoken") {
      return "mock-auth-token";
    }
    if (key === "authorisationType") {
      return "BASIC";
    }
    return undefined;
  });

  // Stub the validateRegionAndAuth method to skip authentication check
  sandbox
    .stub(
      require("../../../src/base-command").BaseCommand.prototype,
      "validateRegionAndAuth"
    )
    .callsFake(() => {});
}
