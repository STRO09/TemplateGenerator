// add reads the metadata created by create. It doesn't offer a module that's already recorded in modules.server.
// For projects created before metadata was introduced, it asks you to identify the stack once and saves it.

import fs from "node:fs";
import path from "node:path";
import { askChoice } from "../lib/prompts.js";
import {
  getStackRoot,
  loadAvailableTech,
  loadModuleRegistry,
} from "../lib/paths.js";
import {
  createProjectMetadata,
  loadProjectMetadata,
  mergeSelectedModules,
  saveProjectMetadata,
} from "../lib/project-metadata.js";
import { chooseModulesForAdd } from "../lib/module-selection.js";
import { integrateSelectedModules } from "../lib/module-integration.js";

export async function addCommand() {
  const targetPath = process.cwd();

  if (!fs.existsSync(path.join(targetPath, "package.json"))) {
    throw new Error(
      "No package.json found. Run 'templategen add' from the root of an existing project.",
    );
  }

  const knowledge = loadAvailableTech();

  let metadata = loadProjectMetadata(targetPath);

  if (!metadata) {
    metadata = await identifyExistingProject(targetPath, knowledge);

    // Save the discovered stack even if no module is added.
    saveProjectMetadata(targetPath, metadata);
  }

  if (!metadata.server?.frameworkKey || !metadata.server?.apiFrameworkKey) {
    throw new Error(
      "Project metadata does not identify a supported server stack. " +
        "Check .templategen/project.json.",
    );
  }

  const moduleRegistry = loadModuleRegistry(
    "server",
    metadata.server.frameworkKey,
    metadata.server.apiFrameworkKey,
  );

  const existingModules = metadata.modules?.server ?? {};

  const selectedModules = await chooseModulesForAdd(
    moduleRegistry,
    existingModules,
  );

  if (Object.keys(selectedModules).length === 0) {
    console.log("No new modules selected.");
    return;
  }

  const updatedMetadata = mergeSelectedModules(metadata, selectedModules);

  const stackRoot = getStackRoot(metadata.server);

  await integrateSelectedModules({
    targetPath,
    stackRoot,
    moduleRegistry,
    selectedModules,
    metadata: updatedMetadata,
    askChoice,
    installQuestion: "Run npm install after adding modules?",
  });

  console.log("");
  console.log("Modules added successfully.");
  console.log("");
}

async function identifyExistingProject(targetPath, knowledge) {
  console.log("");
  console.log(
    "No TemplateGen metadata found. Identify this project's stack once.",
  );
  console.log("");

  const frameworkEntries = Object.entries(knowledge.server.frameworks).filter(
    ([, definition]) => definition.implemented,
  );

  const frameworkKey = await askChoice(
    "Choose the existing project's server framework:",
    frameworkEntries.map(([key, definition]) => ({
      value: key,
      label: definition.name,
    })),
  );

  const frameworkDefinition = knowledge.server.frameworks[frameworkKey];

  const apiFrameworkEntries = Object.entries(
    frameworkDefinition.apiFrameworks ?? {},
  ).filter(([, definition]) => definition.implemented);

  if (apiFrameworkEntries.length === 0) {
    throw new Error(
      `No implemented API frameworks are available for ${frameworkDefinition.name}.`,
    );
  }

  const apiFrameworkKey = await askChoice(
    `Choose ${frameworkDefinition.name} API framework:`,
    apiFrameworkEntries.map(([key, definition]) => ({
      value: key,
      label: definition.name,
    })),
  );

  return createProjectMetadata({
    projectName: path.basename(targetPath),

    server: {
      language: frameworkDefinition.language,
      framework: frameworkDefinition.name,
      frameworkKey,
      apiFramework: frameworkDefinition.apiFrameworks[apiFrameworkKey].name,
      apiFrameworkKey,
    },

    modules: {
      client: {},
      server: {},
    },
  });
}
