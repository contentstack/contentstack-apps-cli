import { resolve } from "path";

const config = {
  defaultAppName: "app-boilerplate",
  manifestPath: resolve(__dirname, "manifest.json"),
  developerHubBaseUrl: "",
  appBoilerplateGithubUrl:
    "https://codeload.github.com/contentstack/marketplace-app-boilerplate/zip/refs/heads/main",
  defaultAppFileName: "manifest",
  boilerplatesUrl: 'https://marketplace-artifacts.contentstack.com/cli/starter-template.json'
};

export default config;
