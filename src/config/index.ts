import { resolve } from "path";

const config = {
  defaultAppName: "app-boilerplate",
  manifestPath: resolve(__dirname, "manifest.json"),
  boilerplateName: "marketplace-app-boilerplate-main",
  developerHubBaseUrl: "",
  developerHubUrls: {
    // NOTE CDA url used as developer-hub url mapper to avoid conflict if user used any custom name
    "https://api.contentstack.io": "developerhub-api.contentstack.com",
    "https://eu-api.contentstack.com": "eu-developerhub-api.contentstack.com",
    "https://azure-na-api.contentstack.com":
      "azure-na-developerhub-api.contentstack.com",
    "https://azure-eu-api.contentstack.com":
      "azure-eu-developerhub-api.contentstack.com",
    "https://gcp-na-api.contentstack.com": "gcp-na-developerhub-api.contentstack.com",
  },
  appBoilerplateGithubUrl:
    "https://codeload.github.com/contentstack/marketplace-app-boilerplate/zip/refs/heads/main",
  defaultAppFileName: "manifest",
};

export default config;
