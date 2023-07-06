import { join } from "path";

const config = {
  manifestPath: join(__dirname, "manifest.json"),
  boilerplateName: "marketplace-app-boilerplate-main",
  developerHubBaseUrl: "developerhub-api.contentstack.com",
  appBoilerplateGithubUrl:
    "https://github.com/contentstack/marketplace-app-boilerplate/archive/refs/heads/main.zip",
};

export default config;
