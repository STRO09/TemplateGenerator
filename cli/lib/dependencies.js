// This adds selected provider dependencies to package.json before npm starts, while preserving unrelated dependencies.

import fs from "node:fs";
import path from "node:path";

export function mergeSelectedDependencies({
  targetPath,
  moduleRegistry,
  selectedModules,
}) {
  if (!Object.keys(selectedModules ?? {}).length) {
    return false;
  }

  const packagePath = path.join(targetPath, "package.json");

  if (!fs.existsSync(packagePath)) {
    throw new Error(`package.json not found: ${packagePath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  packageJson.dependencies ??= {};

  let changed = false;

  for (const [moduleKey, selection] of Object.entries(selectedModules)) {
    const provider =
      moduleRegistry.modules?.[moduleKey]?.providers?.[selection.provider];

    if (!provider) {
      throw new Error(
        `Provider "${selection.provider}" not found for module "${moduleKey}".`,
      );
    }

    for (const [manager, dependencies] of Object.entries(
      provider.dependencies ?? {},
    )) {
      if (manager !== "npm") {
        throw new Error(
          `Dependency manager "${manager}" is not supported yet.`,
        );
      }

      for (const [name, requestedVersion] of Object.entries(dependencies)) {
        const productionVersion = packageJson.dependencies[name];

        const developmentVersion = packageJson.devDependencies?.[name];

        const existingVersion = productionVersion ?? developmentVersion;

        if (existingVersion && existingVersion !== requestedVersion) {
          throw new Error(
            `Dependency conflict for "${name}": project has ` +
              `"${existingVersion}", provider requests "${requestedVersion}".`,
          );
        }

        if (!productionVersion) {
          packageJson.dependencies[name] = existingVersion ?? requestedVersion;

          if (developmentVersion) {
            delete packageJson.devDependencies[name];
          }

          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(
      packagePath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      "utf8",
    );

    console.log("Updated package.json with selected module dependencies.");
  }

  return changed;
}
