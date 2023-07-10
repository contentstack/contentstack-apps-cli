import { join } from "path";

const config = {
  manifestPath: join(__dirname, "manifest.json"),
  boilerplateName: "marketplace-app-boilerplate-main",
  developerHubBaseUrl: "",
  developerHubUrls: {
    // NOTE CDA url used as developer-hub url mapper to avoid conflict if user used any custom name
    "https://api.contentstack.io": "https://developerhub-api.contentstack.com",
    "https://eu-api.contentstack.com":
      "https://eu-developerhub-api.contentstack.com",
    "https://azure-na-api.contentstack.com":
      "https://azure-na-developerhub-api.contentstack.com",
    "https://azure-eu-api.contentstack.com":
      "https://azure-eu-developerhub-api.contentstack.com",
    "https://stag-api.csnonprod.com":
      "https://stag-developerhub-api.csnonprod.com",
  },
};

export default config;
