// only responsibility is returning the selected configuration.

async function setupNodeJS(
  askChoice,
  knowledge,
  frameworkKey,
  preferredApiFrameworkKey = null,
) {
  const node = knowledge.server.frameworks[frameworkKey];

  if (!node) {
    throw new Error(`Unknown Node.js framework key: ${frameworkKey}`);
  }

  const apiFrameworks = node.apiFrameworks ?? {};

  const choices = [
    { value: "none", label: "No framework" },

    ...Object.entries(apiFrameworks).map(([key, definition]) => ({
      value: key,
      label:
        `${definition.name}` +
        `${definition.implemented ? "" : " (not implemented yet)"}`,
    })),
  ];

  let apiFrameworkKey = preferredApiFrameworkKey;

  if (apiFrameworkKey) {
    const selected = apiFrameworks[apiFrameworkKey];

    if (!selected) {
      throw new Error(
        `Unknown API framework "${apiFrameworkKey}" for ${node.name}.`,
      );
    }

    if (!selected.implemented) {
      throw new Error(`${selected.name} is known, but is not implemented yet.`);
    }
  } else {
    while (true) {
      apiFrameworkKey = await askChoice(
        `Choose ${node.name} API framework:`,
        choices,
      );

      if (apiFrameworkKey === "none") {
        return {
          configuration: {
            language: node.language,
            framework: node.name,
            frameworkKey,
            apiFramework: null,
            apiFrameworkKey: null,
          },
        };
      }

      if (apiFrameworks[apiFrameworkKey]?.implemented) {
        break;
      }

      console.log(
        `${apiFrameworks[apiFrameworkKey]?.name ?? apiFrameworkKey} is not implemented yet.`,
      );
    }
  }

  const definition = apiFrameworks[apiFrameworkKey];

  return {
    configuration: {
      language: node.language,
      framework: node.name,
      frameworkKey,
      apiFramework: definition.name,
      apiFrameworkKey,
    },
  };
}

export default setupNodeJS;
