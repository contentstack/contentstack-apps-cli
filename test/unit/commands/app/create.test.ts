import { expect } from "chai";
import { PassThrough } from "stream";
import nock from "nock";
import fs from "fs";
import tmp from "tmp";
import shelljs from "shelljs";
import { join } from "path";
import sinon from "sinon";
import { runCommand } from "@oclif/test";
import { cliux, configHandler } from "@contentstack/cli-utilities";
import messages from "../../../../src/messages";
import config from "../../../../src/config";
import * as mock from "../../mock/common.mock.json";
import manifestData from "../../../../src/config/manifest.json";
import orgManifestData from "../../../unit/config/org_manifest.json";
import { getDeveloperHubUrl } from "../../../../src/util/inquirer";
import axios from "axios";
import { stubAuthentication } from "../../helpers/auth-stub-helper";

const { origin, pathname } = new URL(config.appBoilerplateGithubUrl);
const zipPath = join(process.cwd(), "test", "unit", "mock", "boilerplate.zip");
const region: { cma: string; name: string; cda: string } =
  configHandler.get("region");
const developerHubBaseUrl = getDeveloperHubUrl();

class MockWriteStream extends PassThrough implements fs.WriteStream {
  close() {}
  bytesWritten = 0;
  path = "/mock/path";
  pending = false;
}

describe("app:create", () => {
  let sandbox: sinon.SinonSandbox;
  let writeStreamMock: MockWriteStream;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axios.defaults.adapter = "http";

    // Stub authentication using shared helper
    stubAuthentication(sandbox);

    writeStreamMock = new MockWriteStream();
    sandbox.stub(fs, "renameSync").callsFake(() => {});
    sandbox.stub(fs, "createWriteStream").callsFake(() => writeStreamMock);
    sandbox.stub(tmp, "fileSync").callsFake(() => ({
      name: zipPath,
      fd: 1,
      removeCallback: sandbox.stub(),
    }));
    nock(origin).get(pathname).reply(200, { data: "test-data" });
    nock(region.cma)
      .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
      .reply(200, { organizations: mock.organizations });
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  describe("Creating a stack app using a boilerplate flow", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", { ...manifestData, name: "test-app" })
        .reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        });
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });

    it("should create a stack-level app", async () => {
      const { stdout } = await runCommand(
        ["app:create", "--name", "test-app", "--data-dir", process.cwd()],
        { root: process.cwd() }
      );
      expect(stdout).to.contain(messages.APP_CREATION_SUCCESS);
    });
  });

  describe("Creating an organization app using a boilerplate flow", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", {
          ...orgManifestData,
          name: "test-app",
          target_type: "organization",
        })
        .reply(200, {
          data: {
            ...orgManifestData,
            name: "test-app",
            version: 1,
          },
        });

      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });

    it("should create an organization-level app", async () => {
      const { stdout } = await runCommand(
        [
          "app:create",
          "--name",
          "test-app",
          "--data-dir",
          process.cwd(),
          "--app-type",
          "organization",
        ],
        { root: process.cwd() }
      );
      expect(stdout).to.contain(messages.APP_CREATION_SUCCESS);
    });
  });

  describe("Creating an app without boilerplate", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          console.log("Received request body:", body);
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(200, {
          data: { ...manifestData, name: "test-app", version: 1 },
        });
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });

    it("should create a stack-level app", async () => {
      try {
        const { stdout } = await runCommand(
          ["app:create", "--name", "test-app", "--data-dir", process.cwd()],
          { root: process.cwd() }
        );
        expect(stdout).to.contain(messages.APP_CREATION_SUCCESS);
      } catch (err) {
        console.error("Error during command execution:", err);
        throw err;
      }
    });
  });

  describe.skip("Boilerplate clone failure", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });
  });

  describe("App creation should fail and rollback", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(400, {
          data: { errorMessage: "App creation failed due to constraints." },
        });
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });

    it("App creation should fail and rollback", async () => {
      const result = await runCommand<string>(
        ["app:create", "--name", "test-app", "--data-dir", process.cwd()],
        { root: process.cwd() }
      );
      expect(result.stdout).to.contain(
        messages.APP_CREATION_CONSTRAINT_FAILURE
      );
    });
  });

  describe("Pass external config using '--config' flag", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(400, {
          errorMessage: "App creation failed due to constraints.",
        });
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: false,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(0, "", "");
            return { stdout: "", stderr: "", code: 0 } as any;
          }
        );
    });

    it("App creation should fail!", async () => {
      const tmp = require("tmp");
      const fs = require("fs");
      const path = require("path");
      const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;
      // Create a minimal manifest.json file in the temp directory
      fs.writeFileSync(
        path.join(tempDir, "manifest.json"),
        JSON.stringify({ name: "test-app", target_type: "stack" })
      );
      const result = await runCommand(
        [
          "app:create",
          "--data-dir",
          tempDir,
          "--config",
          join(process.cwd(), "test", "unit", "mock", "config.json"),
        ],
        { root: process.cwd() }
      );
      expect(result.stdout).to.contain("App could not be registered");
    });
  });

  describe("Dependency installation failure", () => {
    beforeEach(() => {
      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox
        .stub(shelljs, "cd")
        .callsFake(() => ({ stdout: "", stderr: "", code: 0 } as any));
      sandbox
        .stub(shelljs, "exec")
        .callsFake(
          (
            _cmd: string,
            _opts: any,
            callback?: (code: number, stdout: string, stderr: string) => void
          ) => {
            if (callback) callback(1, "", "EEXIT: 1");
            return { stdout: "", stderr: "", code: 1 } as any;
          }
        );

      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(400, {
          data: { errorMessage: "App creation failed due to constraints." },
        });
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
    });

    it("dependency install step should fail", async () => {
      const result = await runCommand([
        "app:create",
        "--name",
        "test-app",
        "--data-dir",
        process.cwd(),
      ]);
      expect(result.stdout).to.contain("App could not be registered");
    });
  });

  describe("App creation with duplicate app name", () => {
    beforeEach(() => {
      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(409, {
          errorMessage: "App with this name already exists.",
        });

      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
    });

    it("should fail when app name already exists", async () => {
      const result = await runCommand([
        "app:create",
        "--name",
        "test-app",
        "--data-dir",
        process.cwd(),
      ]);
      expect(result.stdout).to.contain("already exists");
    });
  });

  describe("App creation with organization UID instead of app UID", () => {
    beforeEach(() => {
      nock(region.cma)
        .get("/v3/organizations?limit=100&asc=name&include_count=true&skip=0")
        .reply(200, { organizations: mock.organizations });

      nock(`https://${developerHubBaseUrl}`)
        .post("/manifests", (body) => {
          return body.name === "test-app" && body.target_type === "stack";
        })
        .reply(400, {
          errorMessage:
            "Invalid app configuration. Organization UID provided instead of app data.",
        });

      sandbox.stub(cliux, "loader").callsFake(() => {});
      sandbox.stub(fs, "writeFileSync").callsFake(() => {});
      sandbox.stub(cliux, "inquire").callsFake((prompt: any) => {
        const cases: Record<string, any> = {
          appName: "test-app",
          cloneBoilerplate: true,
          Organization: "test org 1",
        };
        return Promise.resolve(cases[prompt.name]);
      });
    });

    it("should fail when organization UID is used instead of app data", async () => {
      const result = await runCommand([
        "app:create",
        "--name",
        "test-app",
        "--data-dir",
        process.cwd(),
      ]);
      expect(result.stdout).to.contain("App could not be registered");
    });
  });
});
