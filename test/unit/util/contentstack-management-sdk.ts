const apps = () => {
  return {
    create: async () => {
      return require("../../../src/config/manifest.json");
    },
  };
};

const organization = () => {
  return {
    app: (_uid?: string) => ({
      ...apps(),
    }),
  };
};

export { organization };
