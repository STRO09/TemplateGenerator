import fs from "node:fs";
import path from "node:path";
import { askChoice } from "../lib/prompts.js";
import {
  getStackRoot,
  loadModuleRegistry,
  resolveInside,
} from "../lib/paths.js";
import {
  loadProjectMetadata,
  mergeSelectedModules,
} from "../lib/project-metadata.js";
import { chooseModulesForAdd } from "../lib/module-selection.js";
import { integrateSelectedModules } from "../lib/module-integration.js";

export async function addCommand() {
  const projectRoot = process.cwd();
  const metadataPath = path.join(
    projectRoot,
    ".templategen",
    "project.json",
  );

  const metadata = loadProjectMetadata(projectRoot);

  if (!metadata) {
    throw new Error(
      `TemplateGen metadata not found at ${metadataPath}.\n` +
      "Run 'templategen add' from the root of a TemplateGen project.",
    );
  }

  const targets = [];

  for (const type of ["client", "server"]) {
    const app = metadata[type];

    if (app == null) continue;

    if (
      typeof app.directoryName !== "string" ||
      !app.directoryName.trim()
    ) {
      throw new Error(
        `Invalid ${type} configuration in ${metadataPath}: ` +
        "directoryName is missing.",
      );
    }

    targets.push({ type, app });
  }

  if (targets.length === 0) {
    throw new Error(
      "No client or server app is configured in .templategen/project.json.",
    );
  }

  let selectedTarget;

  if (targets.length === 1) {
    selectedTarget = targets[0];
  } else {
    const targetType = await askChoice(
      "Which app do you want to add modules to?",
      targets.map(({ type, app }) => ({
        value: type,
        label: `${type === "client" ? "Client" : "Server"} (${app.directoryName})`,
      })),
    );

    selectedTarget = targets.find(({ type }) => type === targetType);
  }

  const { type, app } = selectedTarget;

  // Client module registry and template resolution are not yet
  // implemented by the server-specific loaders currently in use.
  if (type === "client") {
    throw new Error(
      "Adding client modules is not yet supported. " +
      "The current module registry and template resolution flow " +
      "supports server apps only.",
    );
  }

  if (!app.frameworkKey || !app.apiFrameworkKey) {
    throw new Error(
      "The server stack configuration is incomplete. " +
      "Check .templategen/project.json.",
    );
  }

  // Module files, dependencies, integrations, and npm all target
  // the app directory, not the enclosing project root.
  const targetPath = resolveInside(
    projectRoot,
    app.directoryName,
    "Server app directory",
  );

  const packagePath = path.join(targetPath, "package.json");

  if (
    !fs.existsSync(packagePath) ||
    !fs.statSync(packagePath).isFile()
  ) {
    throw new Error(
      `package.json not found: ${packagePath}\n` +
      "Check the server directoryName in .templategen/project.json.",
    );
  }

  const moduleRegistry = loadModuleRegistry(
    "server",
    app.frameworkKey,
    app.apiFrameworkKey,
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

  const updatedMetadata = mergeSelectedModules(
    metadata,
    selectedModules,
    "server",
  );

  const stackRoot = getStackRoot(app);

  await integrateSelectedModules({
    targetPath,
    metadataPath: projectRoot,
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