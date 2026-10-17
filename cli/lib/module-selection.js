// This file preserves the “Add modules now or later?” question in create.
// The add command skips that question and immediately lists modules that aren't already in metadata.

import { askChoice } from "./prompts.js";

export async function chooseModulesForCreate(moduleRegistry) {
  const implementedModules = getImplementedModules(moduleRegistry);

  if (implementedModules.length === 0) {
    console.log("No implemented modules are available for this stack.");
    return {};
  }

  const timing = await askChoice("Add modules now or later?", [
    { value: "now", label: "Now" },
    { value: "later", label: "Later" },
  ]);

  if (timing === "later") return {};

  return chooseModulesLoop(moduleRegistry, {});
}

export async function chooseModulesForAdd(
  moduleRegistry,
  existingModules = {},
) {
  return chooseModulesLoop(moduleRegistry, existingModules);
}

function getImplementedModules(moduleRegistry) {
  return Object.entries(moduleRegistry?.modules ?? {}).filter(
    ([, definition]) => definition.implemented,
  );
}

async function chooseModulesLoop(moduleRegistry, excludedModules) {
  const chosenModules = {};
  const allModules = getImplementedModules(moduleRegistry);

  while (true) {
    const availableModules = allModules.filter(
      ([key]) => !excludedModules[key] && !chosenModules[key],
    );

    const moduleKey = await askChoice("Choose a module:", [
      ...availableModules.map(([key, definition]) => ({
        value: key,
        label: definition.name,
      })),
      { value: "done", label: "Done" },
    ]);

    if (moduleKey === "done") break;

    const moduleDefinition = moduleRegistry.modules[moduleKey];

    const implementedProviders = Object.entries(
      moduleDefinition.providers ?? {},
    ).filter(([, provider]) => provider.implemented);

    if (implementedProviders.length === 0) {
      console.log(
        `No implemented providers are available for ${moduleDefinition.name}.`,
      );
      continue;
    }

    // Always prompt for a provider, even if there is only one.
    const providerKey = await askChoice(
      `Choose provider for ${moduleDefinition.name}:`,
      implementedProviders.map(([key, provider]) => ({
        value: key,
        label: provider.name,
      })),
    );

    const provider = moduleDefinition.providers[providerKey];

    chosenModules[moduleKey] = {
      provider: providerKey,
    };

    printSelection(moduleDefinition, provider);
  }

  return chosenModules;
}

function printSelection(moduleDefinition, provider) {
  console.log("");
  console.log(`Module: ${moduleDefinition.name}`);
  console.log(`Provider: ${provider.name}`);

  console.log("Dependencies:");

  const dependencyManagers = Object.entries(provider.dependencies ?? {});

  if (dependencyManagers.length === 0) {
    console.log("  None");
  }

  for (const [manager, dependencies] of dependencyManagers) {
    console.log(`  ${manager}:`);

    for (const [name, version] of Object.entries(dependencies)) {
      console.log(`    ${name}: ${version}`);
    }
  }

  console.log("File mappings:");

  if (!provider.files?.length) {
    console.log("  None");
  }

  for (const mapping of provider.files ?? []) {
    console.log(`  ${mapping.from} -> ${mapping.to}`);
  }

  console.log("Integrations:");

  if (!provider.integrations?.length) {
    console.log("  None");
  }

  for (const integration of provider.integrations ?? []) {
    console.log(`  ${integration.operation}: ${integration.file}`);
  }

  console.log("");
}