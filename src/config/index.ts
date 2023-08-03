import { resolve } from "path";

const config = {
  defaultAppName: "app-boilerplate",
  manifestPath: resolve(__dirname, "manifest.json"),
  boilerplateName: "marketplace-app-boilerplate-1.2.3",
  developerHubBaseUrl: "",
  developerHubUrls: {
    // NOTE CDA url used as developer-hub url mapper to avoid conflict if user used any custom name
    "https://api.contentstack.io": "developerhub-api.contentstack.com",
    "https://eu-api.contentstack.com": "eu-developerhub-api.contentstack.com",
    "https://azure-na-api.contentstack.com":
      "azure-na-developerhub-api.contentstack.com",
    "https://azure-eu-api.contentstack.com":
      "azure-eu-developerhub-api.contentstack.com",
    "https://stag-api.csnonprod.com": "stag-developerhub-api.csnonprod.com",
  },
  appBoilerplateGithubUrl:
    "https://github.com/contentstack/marketplace-app-boilerplate/archive/refs/tags/1.2.3.zip",
  defaultAppFileName: "manifest",
};

export default config;
