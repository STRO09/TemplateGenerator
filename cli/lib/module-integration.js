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
      const moduleErrors = [];
      const failedModuleKeys = new Set();

      for (const [moduleKey, selection] of Object.entries(selectedModules)) {
        try {
          copySelectedModuleFiles({
            targetPath,
            stackRoot,
            selectedModules: { [moduleKey]: selection },
            moduleRegistry,
          });

          applySelectedModuleIntegrations({
            targetPath,
            moduleRegistry,
            selectedModules: { [moduleKey]: selection },
          });
        } catch (error) {
          console.error(
            `\nWarning: Module "${moduleKey}" integration failed and was skipped: ${error.message}`,
          );
          moduleErrors.push(error);
          failedModuleKeys.add(moduleKey);
        }
      }

      // Strip failed modules so project.json only records what was actually applied.
      if (failedModuleKeys.size > 0 && metadata?.modules?.server) {
        metadata = {
          ...metadata,
          modules: {
            ...metadata.modules,
            server: Object.fromEntries(
              Object.entries(metadata.modules.server).filter(
                ([key]) => !failedModuleKeys.has(key),
              ),
            ),
          },
        };
      }

      if (moduleErrors.length > 0) {
        integrationError =
          moduleErrors.length === 1
            ? moduleErrors[0]
            : new AggregateError(moduleErrors, "One or more module integrations failed.");
      }
    }

    // Save metadata at the main project root even when some modules failed.
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