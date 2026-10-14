// This keeps the current interactive server setup and the explicit command form:
// templategen create my-app --server node --server-framework express
// Client scaffolding remains unimplemented because all client options
// in the supplied availableTech.json are marked implemented: false.

import { askChoice } from "./prompts.js";
import { loadAvailableTech } from "./paths.js";

export async function configureTargets(options = {}) {
  const knowledge = loadAvailableTech();

  // Folder names require their corresponding technology selections.
  if (options.serverName && !options.server) {
    throw new Error("--servername requires -server.");
  }

  if (options.clientName && !options.client) {
    throw new Error("--clientname requires -client.");
  }

  if (options.apiFramework && !options.server) {
    throw new Error("--apiframework requires -server.");
  }

  // Client scaffolding is not implemented yet.
  // Reject it before creating or modifying project files.
  if (options.client) {
    throw new Error(
      "Client scaffolding is not implemented yet. " +
        "The selected client technology was: " +
        `"${options.client}". No project files were created.`,
    );
  }

  // Explicit server configuration:
  // -server node --servername server --apiframework express
  if (options.server) {
    if (!options.apiFramework) {
      throw new Error(
        "Server setup requires --apiframework. " +
          "Example: -server node --apiframework express",
      );
    }

    return {
      client: null,
      server: await configureExplicitServer(
        options.server,
        options.apiFramework,
        knowledge,
      ),
    };
  }

  // Preserve the existing interactive setup when no technology
  // selection was provided in the command.
  console.log("");
  console.log("No client or server specified.");
  console.log("Let's initialize your project.");
  console.log("");

  const choice = await askChoice("What do you want to create?", {
    client: "Client",
    server: "Server",
    both: "Client + Server",
  });

  if (choice !== "server") {
    throw new Error(
      "Client scaffolding is not implemented yet. " +
        "Choose Server for the currently supported workflow.",
    );
  }

  return {
    client: null,
    server: await configureInteractiveServer(knowledge),
  };
}

async function configureInteractiveServer(knowledge) {
  const languageKey = await chooseImplementedEntry(
    "Choose server language:",
    knowledge.server.languages,
  );

  if (languageKey !== "javascript") {
    throw new Error(
      `Server setup for ${knowledge.server.languages[languageKey].name} is not implemented yet.`,
    );
  }

  const frameworkEntries = Object.entries(knowledge.server.frameworks).filter(
    ([, definition]) => definition.language === languageKey,
  );

  const frameworkKey = await chooseFramework(frameworkEntries);

  return runTechnologySetup(languageKey, frameworkKey, null, knowledge);
}

async function configureExplicitServer(
  serverFrameworkOption,
  apiFrameworkOption,
  knowledge,
) {
  const frameworkKey = String(serverFrameworkOption).toLowerCase();
  const apiFrameworkKey = String(apiFrameworkOption).toLowerCase();

  const definition = knowledge.server.frameworks[frameworkKey];

  if (!definition) {
    throw new Error(
      `Unknown server framework "${serverFrameworkOption}". ` +
        'Use a key from availableTech.json, such as "node".',
    );
  }

  if (!definition.implemented) {
    throw new Error(
      `Server framework "${serverFrameworkOption}" is not implemented yet.`,
    );
  }

  if (!definition.apiFrameworks?.[apiFrameworkKey]) {
    throw new Error(
      `API framework "${apiFrameworkOption}" is not available under ` +
        `"${frameworkKey}" in availableTech.json.`,
    );
  }

  if (!definition.apiFrameworks[apiFrameworkKey].implemented) {
    throw new Error(
      `API framework "${apiFrameworkOption}" is not implemented yet.`,
    );
  }

  return runTechnologySetup(
    definition.language,
    frameworkKey,
    apiFrameworkKey,
    knowledge,
  );
}

async function chooseImplementedEntry(question, definitions) {
  const choices = Object.entries(definitions).map(([key, definition]) => ({
    value: key,
    label:
      `${definition.name}` +
      `${definition.implemented ? "" : " (not implemented yet)"}`,
  }));

  while (true) {
    const key = await askChoice(question, choices);

    if (definitions[key].implemented) return key;

    console.log(
      `${definitions[key].name} is known, but is not implemented yet. Choose another option.`,
    );
  }
}

async function chooseFramework(frameworkEntries) {
  const choices = [
    { value: "none", label: "No framework" },

    ...frameworkEntries.map(([key, definition]) => ({
      value: key,
      label:
        `${definition.name}` +
        `${definition.implemented ? "" : " (not implemented yet)"}`,
    })),
  ];

  while (true) {
    const key = await askChoice("Choose JavaScript framework:", choices);

    if (key === "none") {
      throw new Error(
        "A no-framework base template is not implemented yet. " +
          "Choose Node.js for the currently supported template.",
      );
    }

    const selected = Object.fromEntries(frameworkEntries)[key];

    if (selected?.implemented) return key;

    console.log(
      `${selected?.name ?? key} is known, but is not implemented yet. Choose another option.`,
    );
  }
}

async function runTechnologySetup(
  languageKey,
  frameworkKey,
  preferredApiFrameworkKey,
  knowledge,
) {
  const moduleUrl = new URL(
    `../tech/${languageKey}/${frameworkKey}.js`,
    import.meta.url,
  );

  const technology = await import(moduleUrl.href);

  const result = await technology.default(
    askChoice,
    knowledge,
    frameworkKey,
    preferredApiFrameworkKey,
  );

  if (
    !result.configuration?.frameworkKey ||
    !result.configuration?.apiFrameworkKey
  ) {
    throw new Error(
      "A base template requires a framework and an API framework.",
    );
  }

  return result.configuration;
}
