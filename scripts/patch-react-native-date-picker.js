const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-date-picker",
  "package.json",
);

const patchPackageJson = () => {
  if (!fs.existsSync(packageJsonPath)) {
    console.warn("react-native-date-picker not installed; skipping patch.");
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const currentConfig = packageJson.codegenConfig;

  if (!currentConfig) {
    return;
  }

  const nextConfig = {
    ...currentConfig,
    type: "components",
    ios: {
      ...currentConfig.ios,
      componentProvider: currentConfig.ios?.componentProvider || {
        RNDatePicker: "RNDatePicker",
      },
    },
  };

  delete nextConfig.ios.modulesProvider;

  const changed = JSON.stringify(currentConfig) !== JSON.stringify(nextConfig);
  if (!changed) {
    return;
  }

  packageJson.codegenConfig = nextConfig;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log("Patched react-native-date-picker codegen config for iOS new architecture.");
};

patchPackageJson();