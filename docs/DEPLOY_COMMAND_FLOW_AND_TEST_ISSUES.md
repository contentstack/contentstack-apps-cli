# Deploy command: full flow and test failure analysis

## 1. How the deploy command runs (line-by-line)

### 1.1 Command load and init (before `run()`)

When `runCommand(["app:deploy"], { root: process.cwd() })` is called:

1. **Oclif loads config** from project root. `package.json` has `"oclif": { "commands": "./lib/commands" }`, so the **Deploy class is loaded from `lib/commands/app/deploy.js`** (compiled), not from `src/`.

2. **Command instance is created** (e.g. `new Deploy()`).

3. **`init()` is called** (before `run()`):
   - **AppCLIBaseCommand.init()** runs:
     - `await super.init()` → **BaseCommand.init()** (from `lib/base-command.js`).
   - **BaseCommand.init()** (lib):
     - `await super.init()` (oclif Command).
     - `this.parse(...)` → sets `this.flags`, `this.args`.
     - `cliux.registerSearchPlugin()`.
     - `this.registerConfig()`.
     - `new Logger(...)`, `this.log = ...`.
     - **`this.validateRegionAndAuth()`** → uses `this.region`, `isAuthenticated()`. *(Test stubs this via `stubAuthentication` on `BaseCommand.prototype.validateRegionAndAuth`.)*
     - `this.developerHubBaseUrl = ...` or `getDeveloperHubUrl()`.
     - **`await this.initCmaSDK()`** → calls `managementSDKClient({ host: this.cmaHost })` and `managementSDKClient({ host: this.developerHubBaseUrl })`. **Real HTTP clients are created here; no request yet.**
     - **`await this.initMarketplaceSDK()`** → `marketplaceSDKClient({ host: this.developerHubBaseUrl })`. **Real marketplace client created.**
   - Back in **AppCLIBaseCommand.init()**: `this.getManifestData()` (reads manifest from cwd if present).

4. **`run()` is called** on the same instance.

### 1.2 Deploy.run() (line-by-line)

- **70**  
  `flags["app-uid"] = this.manifestData?.uid ?? flags["app-uid"];`  
  *(No manifest in test, so uses flags.)*

- **71**  
  `this.sharedConfig.org = await this.getOrganization();`  
  - **getOrganization()** (Deploy): if no `manifestData?.organization_uid`, calls **`getOrg(this.flags, { managementSdk: this.managementSdk, log: this.log })`**.  
  - **getOrg** (from `util`, i.e. inquirer + common-utils):  
    - Calls **`getOrganizations(options)`** → **`options.managementSdk.organization().fetchAll({ limit: 100, asc: "name", include_count: true, skip: 0 })`**.  
    - **First real HTTP:** GET to CMA `.../v3/organizations?limit=100&...`.  
    - If that returns 401, the management SDK’s `refreshToken()` runs and rejects with **"Session timed out, please login to proceed"**.  
  - If org list is returned, getOrg uses `flags.org` + that list (or prompts via cliux.inquire).  
  *(Test stubs `cliux.inquire` to return mock org/app names.)*

- **72**  
  `const app = await this.fetchAppDetails();`  
  - **fetchAppDetails()**: if no `this.flags["app-uid"]` → **getApp(...)** (lists apps then inquirer); else **fetchApp(...)** (single app).  
  - Both use **`this.marketplaceAppSdk`** (e.g. `marketplace(orgUid).findAllApps()` or `.app(uid).fetch()`).  
  - **Second/third real HTTP:** developer hub manifests (list or single).  
  *(If init used real SDKs, these hit the real API and can 401.)*

- **74–75**  
  `const apolloClient = await this.getApolloClient();`  
  `const projects = await getProjects(apolloClient);`  
  - **getApolloClient()**: builds Launch URL, **`new GraphqlApiClient({...}).apolloClient`**.  
  - **getProjects(apolloClient)**: **`apolloClient.query({ query: projectsQuery, variables: { query: {} } })`**.  
  - **Fourth real HTTP:** GraphQL to Launch API.  
  *(If not stubbed, this can return 401 and surface as ApolloError.)*

- **76**  
  `await this.handleAppDisconnect(projects);`  
  - Uses `this.marketplaceAppSdk` (disconnectApp) only if app is already connected.  
  *(Test stubs `disconnectApp` and `getProjects`-via-mock apolloClient.)*

- **78–105**  
  Hosting type (from flags or getHostingType), then either custom-hosting (getAppUrl, formatUrl, updateApp) or hosting-with-launch (setupConfig, askProjectType, handleHostingWithLaunch, etc.).  
  *(Test stubs getHostingType, getAppUrl, updateApp, formatUrl, inquirer, Launch.run, etc.)*

- **106–116**  
  `updateApp(...)` then success logs.  
  *(Test expects stdout to contain the success message.)*

- **126–129**  
  On error: `this.log(..., "error")` and **`process.exit(1)`**.  
  *(Test stubs `process.exit` to throw so the runner doesn’t exit.)*

So in order, the first places real HTTP can happen are:

1. **init()**  
   - No HTTP inside `initCmaSDK` / `initMarketplaceSDK` themselves; they only create clients.

2. **run() → getOrganization() → getOrg() → getOrganizations()**  
   - Uses **`this.managementSdk`** (set in **initCmaSDK**).  
   - **First HTTP:** CMA GET organizations.  
   - If this hits the real API and gets 401, the SDK turns it into **"Session timed out, please login to proceed"**.

3. **run() → fetchAppDetails()**  
   - Uses **`this.marketplaceAppSdk`** (set in **initMarketplaceSDK**).  
   - **Next HTTP:** developer hub (manifests).

4. **run() → getApolloClient() + getProjects(apolloClient)**  
   - **Next HTTP:** Launch GraphQL (projects query).

So the “Session timed out” message comes from the **management SDK** when **the first CMA request (organizations)** returns 401, i.e. either:

- That request is **not** intercepted by nock (wrong host/path/query), or  
- **initCmaSDK** is **not** stubbed for the command that actually runs, so the real SDK is used and the real request is sent.

---

## 2. What the test does (and where it can go wrong)

### 2.1 Which command class runs?

- **Oclif** loads commands from **`./lib/commands`** (package.json).  
- So the running command is **`lib/commands/app/deploy.js`** → extends **`lib/app-cli-base-command.js`** → extends **`lib/base-command.js`** (BaseCommand).  
- The test file imports **`Deploy` from `src/commands/app/deploy`** and **`BaseCommand` from `src/base-command`** only for **stubbing and expectations**. The **instance that runs** is still created by oclif from **lib**.

### 2.2 Stubs that affect the flow

| Stub | Purpose | Applies to running command? |
|------|--------|-----------------------------|
| **BaseCommandToStub.prototype.initCmaSDK** | Assign mock CMA/marketplace clients so no real HTTP in init | Only if `BaseCommandToStub` is **the same** as `lib/base-command.js`’s BaseCommand. |
| **BaseCommandToStub.prototype.initMarketplaceSDK** | Same | Same as above. |
| **Deploy.prototype.getApolloClient** | Return mock Apollo client so getProjects() doesn’t call real GraphQL | Only if the running Deploy uses **the same** Deploy class as the one we imported from `src` (we import from src; oclif runs **lib**). So **Deploy.prototype** in the test is **src** Deploy; the running instance is **lib** Deploy. Stub on **src** Deploy does **not** apply to **lib** Deploy. |
| **common-utils.getProjects** | Return [] so getProjects isn’t called for real | Command imports getProjects at **load** time (from util → common-utils). So the command holds the **original** getProjects reference. Stubbing `require("...common-utils").getProjects` does **not** change what the already-loaded command calls. So **no**, this stub does not apply. |
| **process.exit** | Throw instead of exit so runner doesn’t exit | Global; applies. |
| **validateRegionAndAuth** | Skip auth check | Stub is on **BaseCommand** (test helper). Running command uses **lib** BaseCommand; if that’s the same module we stubbed, it applies. |
| **cliux.inquire**, **cliux.loader** | Control prompts and loaders | Global cliux; applies. |
| **common-utils.updateApp, disconnectApp, setupConfig, formatUrl, handleProjectNameConflict** | Avoid real API and file logic | Same “load-time reference” issue: command already has a reference to these. Stubbing the **module** after load may or may not affect the command depending on whether it uses the same module instance. |
| **inquirer (getHostingType, getAppUrl, etc.)** | Same | Same as above. |
| **Launch.run** | No real Launch run | Same as above. |

Critical point: the **running** command is from **lib**. So:

- **initCmaSDK / initMarketplaceSDK**: we stub **BaseCommandToStub**, which we set to **lib**’s BaseCommand when `require("lib/base-command")` succeeds. So these stubs **should** apply **only if** the test and oclif see the **same** `lib/base-command` module (same require cache and same process.cwd()).
- **getApolloClient**: we stub **Deploy.prototype** on the class we imported from **src**. The running Deploy is from **lib**, so it’s a **different** class. So **getApolloClient stub does not apply** to the running command. So the running command still calls the **real** getApolloClient() and then real getProjects(apolloClient) → real GraphQL → 401 possible.
- **getProjects**: stubbing the common-utils **module** doesn’t change the reference already held by the command, so the **real getProjects** is still used. Combined with the real getApolloClient, the real GraphQL request runs.

So we have two separate problems:

1. **CMA 401 (“Session timed out”)**  
   - Either nock isn’t matching the organizations request, or the **initCmaSDK** stub isn’t applied to the **lib** BaseCommand (e.g. different module instance or lib not built).

2. **Apollo/GraphQL 401**  
   - **getApolloClient** is stubbed on **src** Deploy, but the running command is **lib** Deploy, so the stub is never used and the real GraphQL call runs.

---

## 3. Root causes (concise)

1. **Stubbing `Deploy.prototype.getApolloClient`** in the test affects **only** the **src** Deploy class. The process that runs when you `runCommand(["app:deploy"])` uses the **lib** Deploy class. So the real **getApolloClient** and **getProjects(apolloClient)** run → real GraphQL → 401.
2. **Stubbing `BaseCommandToStub.prototype.initCmaSDK`** (and initMarketplaceSDK) affects the **lib** BaseCommand only if the test and oclif share the same **lib/base-command** module. If they don’t (e.g. different cwd, or lib not built so we fall back to src BaseCommand while the command still comes from lib), then the real **initCmaSDK** runs → real **managementSDKClient** → first HTTP in **run()** is real CMA organizations request → 401 → “Session timed out”.
3. **Nock** is set for CMA and developer hub, but if the **real** SDK is used (because init wasn’t stubbed for the right BaseCommand), the request is sent and may not match nock (e.g. host/port/query format), so you still get 401 from the live API.

---

## 4. What needs to be true for the test to pass

1. **No real CMA request**  
   - Either **initCmaSDK** is stubbed for the **exact** BaseCommand class that the running Deploy extends (the one from **lib**), so `this.managementSdk` is our mock and **getOrganizations** never does a real HTTP call,  
   - Or nock reliably intercepts the CMA organizations request (correct origin, path, query) and returns 200.

2. **No real GraphQL request**  
   - **getApolloClient** must be stubbed on the **same** Deploy class that is actually run. Right now the running class is **lib** Deploy, so we must stub **lib Deploy’s** prototype (e.g. `require("lib/commands/app/deploy").default.prototype.getApolloClient` or equivalent), not the src Deploy’s.

3. **No real marketplace request** (if we don’t stub init)  
   - Same as CMA: either **initMarketplaceSDK** stubbed for the lib BaseCommand, or nock intercepts all developer hub calls.

---

## 5. Follow-up questions

1. **Do you always run `npm run build` before running tests?**  
   If not, `lib/` might be missing or stale. Then:
   - `require("lib/base-command")` in the test can **throw**, so we use **src** BaseCommand for stubbing.
   - Oclif still loads commands from **lib/commands** (package.json). If lib doesn’t exist, command load may fail or behave oddly.
   So: should tests assume **lib** is present and up to date, or should we change something (e.g. test-only oclif config to use **src** for commands)?

2. **When you run the failing test, what is `process.cwd()`?**  
   If it’s not the repo root, `require(join(process.cwd(), "lib", "base-command"))` might not resolve to the same **lib** that oclif uses, so we might stub the wrong BaseCommand or fail to load lib.

3. **Are you okay with test-only wiring so that the deploy command runs from `src` (e.g. ts-node or a test oclif config with `commands: "./src/commands"`)?**  
   That would make **Deploy** and **BaseCommand** used at runtime the same as the ones we import and stub in the test, so **getApolloClient** and **initCmaSDK**/initMarketplaceSDK stubs would apply and the flow would be fully mockable without depending on nock for CMA/Launch.

---

## 6. Fix applied (stub the same code that runs)

The test was updated so that it stubs the **same** classes and modules that the running command uses:

1. **LibDeploy**  
   `require(join(process.cwd(), "lib", "commands", "app", "deploy")).default`  
   Stub **LibDeploy.prototype.getApolloClient** (not `Deploy` from src). So the command that actually runs (from lib) uses the mock Apollo client and no real GraphQL runs.

2. **libCommonUtils**  
   `require(join(process.cwd(), "lib", "util", "common-utils"))`  
   Stub **getProjects**, **updateApp**, **disconnectApp**, **setupConfig**, **formatUrl**, **handleProjectNameConflict** on this module. The running command requires lib/util, which re-exports this module, so these stubs apply.

3. **libInquirer**  
   `require(join(process.cwd(), "lib", "util", "inquirer"))`  
   Stub **getHostingType**, **getAppUrl**, **askProjectType**, **askConfirmation**, **selectProject**, **askProjectName** on this module. Same as above.

4. **Tests that call sandbox.restore()**  
   The two error-handling tests that do `sandbox.restore()` and re-create stubs now:
   - Use **LibDeploy.prototype.getApolloClient** and **libCommonUtils** / **libInquirer** for all re-stubs.
   - Re-stub **libInquirer** (getHostingType, askProjectType, askProjectName, askConfirmation, selectProject) and **libCommonUtils.updateApp** so the “hosting-with-launch” flow still gets mocked answers and no real `app.update()`.

With this, all 5 deploy tests pass. No need to change oclif to load from src; stubs are applied to the lib code path.
