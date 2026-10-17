import { applySelectedModuleIntegrations } from "../patcher.js";
import { saveProjectMetadata } from "./project-metadata.js";
import { copySelectedModuleFiles } from "./module-files.js";
import { mergeSelectedDependencies } from "./dependencies.js";
import { runNpmInstall } from "./npm.js";

export async function integrateSelectedModules({
  targetPath,
  metadataPath = targetPath,
  stackRoot,
  moduleRegistry,
  selectedModules,
  metadata,
  askChoice,
  installQuestion = "Run npm install?",
}) {
  const hasSelectedModules = Object.keys(selectedModules ?? {}).length > 0;

  if (hasSelectedModules) {
    if (!moduleRegistry) {
      throw new Error("A module registry is required for selected modules.");
    }

    mergeSelectedDependencies({
      targetPath,
      moduleRegistry,
      selectedModules,
    });
  }

  const shouldInstall = await askChoice(installQuestion, [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ]);

  const installOutcome =
    shouldInstall === "yes"
      ? runNpmInstall(targetPath).then(
          () => null,
          (error) => error,
        )
      : Promise.resolve(null);

  let integrationError = null;

  try {
    if (hasSelectedModules) {
      copySelectedModuleFiles({
        targetPath,
        stackRoot,
        selectedModules,
        moduleRegistry,
      });

      applySelectedModuleIntegrations({
        targetPath,
        moduleRegistry,
        selectedModules,
      });
    }

    // Save metadata at the main project root, not inside the server app.
    saveProjectMetadata(metadataPath, metadata);
  } catch (error) {
    integrationError = error;
  }

  const installError = await installOutcome;

  if (integrationError && installError) {
    throw new AggregateError(
      [integrationError, installError],
      "Module integration and npm installation both failed.",
    );
  }

  if (integrationError) throw integrationError;
  if (installError) throw installError;
}