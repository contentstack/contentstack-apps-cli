import { resolve } from "path";

const config = {
  defaultAppName: "app-boilerplate",
  manifestPath: resolve(__dirname, "manifest.json"),
  boilerplateName: "marketplace-app-boilerplate-main",
  developerHubBaseUrl: "",
  appBoilerplateGithubUrl:
    "https://codeload.github.com/contentstack/marketplace-app-boilerplate/zip/refs/heads/main",
  defaultAppFileName: "manifest",
};

export default config;
