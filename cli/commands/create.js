import path from "node:path";

import { ask, askChoice } from "../lib/prompts.js";
import { configureTargets } from "../lib/target-setup.js";
import { getStackRoot, loadModuleRegistry } from "../lib/paths.js";
import { chooseProjectPath, copyBaseTemplate } from "../lib/project-files.js";
import { createProjectMetadata } from "../lib/project-metadata.js";
import { chooseModulesForCreate } from "../lib/module-selection.js";
import { integrateSelectedModules } from "../lib/module-integration.js";

export async function createCommand(args) {
  const { projectName: requestedName, options } = parseCreateArguments(args);

  const { client, server } = await configureTargets(options);

  const { projectName, targetPath: projectPath } =
    await chooseProjectPath(requestedName);

  // Never invent a default such as "server".
  const serverDirectory =
    options.serverName ?? (await ask("Server app folder name: ")).trim();

  validateDirectoryName(serverDirectory, "server folder name");

  server.directoryName = serverDirectory;

  // The server template belongs inside its own named subfolder.
  const serverPath = path.join(projectPath, serverDirectory);

  copyBaseTemplate(server, serverPath);

  const stackRoot = getStackRoot(server);

  const moduleRegistry = loadModuleRegistry(
    "server",
    server.frameworkKey,
    server.apiFrameworkKey,
    { optional: true },
  );

  // Preserve module selection during create.
  const selectedModules = moduleRegistry
    ? await chooseModulesForCreate(moduleRegistry)
    : {};

  const modules = {
    client: {},
    server: selectedModules,
  };

  const metadata = createProjectMetadata({
    projectName,
    client,
    server,
    modules,
  });

  await integrateSelectedModules({
    // package.json, module files, patches, and npm belong to this app.
    targetPath: serverPath,

    // The metadata belongs to the main project root.
    metadataPath: projectPath,

    stackRoot,
    moduleRegistry,
    selectedModules,
    metadata,
    askChoice,
    installQuestion: "Run npm install?",
  });

  console.log("");
  console.log("Project configuration:");
  console.log(
    JSON.stringify(
      {
        name: projectName,
        projectPath,
        client,
        server,
        modules,
      },
      null,
      2,
    ),
  );
  console.log("");
}

function parseCreateArguments(args) {
  const options = {};
  let projectName = null;

  const optionMap = {
    "-server": "server",
    "--servername": "serverName",
    "--apiframework": "apiFramework",
    "-client": "client",
    "--clientname": "clientName",
  };

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];

    if (!argument.startsWith("-")) {
      if (projectName !== null) {
        throw new Error(`Unexpected positional argument: "${argument}".`);
      }

      projectName = argument;
      continue;
    }

    const equalsIndex = argument.indexOf("=");
    const option = equalsIndex >= 0 ? argument.slice(0, equalsIndex) : argument;

    const key = optionMap[option];

    if (!key) {
      throw new Error(
        `Unknown create option: "${option}". ` +
          "Run 'templategen create --help' for usage.",
      );
    }

    if (Object.hasOwn(options, key)) {
      throw new Error(`Option "${option}" was provided more than once.`);
    }

    let value =
      equalsIndex >= 0 ? argument.slice(equalsIndex + 1) : args[index + 1];

    if (equalsIndex < 0) {
      if (!value || value.startsWith("-")) {
        throw new Error(`Option "${option}" requires a value.`);
      }

      index++;
    }

    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Option "${option}" cannot be empty.`);
    }

    options[key] = value.trim();
  }

  if (projectName !== null) {
    projectName = projectName.trim();

    validateDirectoryName(projectName, "project name");
  }

  if (options.apiFramework && !options.server) {
    throw new Error("--apiframework requires -server.");
  }

  if (options.serverName) {
    validateDirectoryName(options.serverName, "--servername");
  }

  if (options.clientName) {
    validateDirectoryName(options.clientName, "--clientname");
  }

  return { projectName, options };
}

function validateDirectoryName(value, optionName) {
  if (
    !value ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    path.isAbsolute(value) ||
    path.basename(value) !== value
  ) {
    throw new Error(`The ${optionName} must be a folder name, not a path.`);
  }
}
