// Metadata is created with the selected module configuration, and add merges newly selected modules
// into the existing metadata instead of replacing it.

import fs from "node:fs";
import path from "node:path";

const METADATA_DIRECTORY = ".templategen";
const METADATA_FILENAME = "project.json";

export function getProjectMetadataPath(projectPath) {
  return path.join(projectPath, METADATA_DIRECTORY, METADATA_FILENAME);
}

export function loadProjectMetadata(projectPath) {
  const metadataPath = getProjectMetadataPath(projectPath);

  if (!fs.existsSync(metadataPath)) return null;

  let metadata;

  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${metadataPath}: ${error.message}`);
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`Invalid project metadata in ${metadataPath}.`);
  }

  return metadata;
}

export function saveProjectMetadata(projectPath, metadata) {
  const metadataPath = getProjectMetadataPath(projectPath);

  fs.mkdirSync(path.dirname(metadataPath), {
    recursive: true,
  });

  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
}

export function createProjectMetadata({
  projectName,
  client = null,
  server = null,
  modules = {},
}) {
  return {
    version: 1,
    projectName,

    client: client
      ? {
          directoryName: client.directoryName ?? null,
          language: client.language ?? null,
          languageKey: client.languageKey ?? null,
          framework: client.framework ?? null,
          frameworkKey: client.frameworkKey ?? null,
        }
      : null,

    server:
      server?.frameworkKey && server?.apiFrameworkKey
        ? {
            directoryName: server.directoryName ?? null,
            language: server.language ?? null,
            frameworkKey: server.frameworkKey,
            apiFrameworkKey: server.apiFrameworkKey,
          }
        : null,

    modules: {
      client: modules.client ?? {},
      server: modules.server ?? {},
    },
  };
}

export function mergeSelectedModules(metadata, selectedModules) {
  return {
    ...metadata,

    modules: {
      ...(metadata.modules ?? {}),
      client: metadata.modules?.client ?? {},

      server: {
        ...(metadata.modules?.server ?? {}),
        ...selectedModules,
      },
    },
  };
}
