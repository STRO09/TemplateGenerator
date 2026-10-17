import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  loadAvailableTech,
  loadModuleRegistry,
  getStackRoot,
} from "../../../cli/lib/paths.js";
import { copyBaseTemplate } from "../../../cli/lib/project-files.js";
import { mergeSelectedDependencies } from "../../../cli/lib/dependencies.js";
import { copySelectedModuleFiles } from "../../../cli/lib/module-files.js";
import { applySelectedModuleIntegrations } from "../../../cli/patcher.js";
import {
  createProjectMetadata,
  saveProjectMetadata,
} from "../../../cli/lib/project-metadata.js";
import { createZipFromDirectory } from "../utils/zip.js";
import ApiError from "../utils/ApiError.js";

/**
 * Returns available technologies and implemented modules from registry.
 */
export function getAvailableTechData() {
  const availableTech = loadAvailableTech();
  const expressRegistry = loadModuleRegistry("server", "node", "express", {
    optional: true,
  });

  const implementedModules = [];
  const comingSoonModules = [];

  if (expressRegistry?.modules) {
    for (const [moduleKey, moduleDef] of Object.entries(expressRegistry.modules)) {
      const providers = [];
      for (const [providerKey, providerDef] of Object.entries(moduleDef.providers ?? {})) {
        providers.push({
          key: providerKey,
          name: providerDef.name ?? providerKey,
          implemented: Boolean(providerDef.implemented),
          dependencies: providerDef.dependencies ?? {},
        });
      }

      const item = {
        key: moduleKey,
        name: moduleDef.name ?? moduleKey,
        implemented: Boolean(moduleDef.implemented),
        providers,
        defaultProvider: providers.find((p) => p.implemented)?.key ?? providers[0]?.key,
      };

      if (item.implemented) {
        implementedModules.push(item);
      } else {
        comingSoonModules.push(item);
      }
    }
  }

  const knownKeys = new Set(implementedModules.map((m) => m.key));
  const candidateCatalog = [
    { key: "map", name: "Map" },
    { key: "redis", name: "Redis" },
    { key: "email", name: "Email" },
    { key: "notification", name: "Notification" },
    { key: "auth", name: "Auth" },
    { key: "cache", name: "Cache" },
    { key: "queue", name: "Queue" },
    { key: "search", name: "Search" },
    { key: "storage", name: "Storage" },
    { key: "payment", name: "Payment" },
    { key: "analytics", name: "Analytics" },
  ];

  for (const candidate of candidateCatalog) {
    if (!knownKeys.has(candidate.key)) {
      comingSoonModules.push({
        key: candidate.key,
        name: candidate.name,
        implemented: false,
        providers: [],
      });
    }
  }

  return {
    rawAvailableTech: availableTech,
    server: {
      language: "javascript",
      framework: "node",
      apiFramework: "express",
      name: "Node.js (Express)",
      implemented: true,
    },
    modules: implementedModules,
    comingSoonModules,
  };
}

/**
 * Validates request configuration, scaffolds the base template,
 * merges dependencies, copies module files, applies AST integrations,
 * and packages the result into a ZIP buffer.
 */
export async function generateProjectArchive({
  projectName,
  serverDirectory = "server",
  modules = {},
}) {
  if (typeof projectName !== "string" || !projectName.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "Project name is required.",
    });
  }

  const cleanName = projectName.trim();

  if (
    cleanName === "." ||
    cleanName === ".." ||
    cleanName.includes("/") ||
    cleanName.includes("\\") ||
    path.basename(cleanName) !== cleanName
  ) {
    throw new ApiError({
      statusCode: 400,
      message: "Project name must be a folder name, not a path.",
    });
  }

  const cleanServerDir = (serverDirectory || "server").trim();

  if (
    cleanServerDir === "." ||
    cleanServerDir === ".." ||
    cleanServerDir.includes("/") ||
    cleanServerDir.includes("\\") ||
    path.basename(cleanServerDir) !== cleanServerDir
  ) {
    throw new ApiError({
      statusCode: 400,
      message: "Server directory must be a folder name, not a path.",
    });
  }

  const frameworkKey = "node";
  const apiFrameworkKey = "express";

  const serverConfig = {
    language: "javascript",
    framework: "Node.js",
    frameworkKey,
    apiFramework: "Express",
    apiFrameworkKey,
    directoryName: cleanServerDir,
  };

  const moduleRegistry = loadModuleRegistry(
    "server",
    frameworkKey,
    apiFrameworkKey,
  );

  if (!moduleRegistry) {
    throw new ApiError({
      statusCode: 500,
      message: "Module registry not found for Node.js Express.",
    });
  }

  // Validate modules strictly against authoritative registry
  const validatedModules = {};

  for (const [moduleKey, requested] of Object.entries(modules ?? {})) {
    if (!requested) continue;

    const providerKey =
      typeof requested === "string" ? requested : requested.provider;

    const moduleDef = moduleRegistry.modules?.[moduleKey];

    if (!moduleDef) {
      throw new ApiError({
        statusCode: 400,
        message: `Module "${moduleKey}" is not recognized by the registry.`,
      });
    }

    if (!moduleDef.implemented) {
      throw new ApiError({
        statusCode: 400,
        message: `Module "${moduleKey}" is not implemented yet.`,
      });
    }

    const providerDef = moduleDef.providers?.[providerKey];

    if (!providerDef) {
      throw new ApiError({
        statusCode: 400,
        message: `Provider "${providerKey}" for module "${moduleKey}" is not recognized.`,
      });
    }

    if (!providerDef.implemented) {
      throw new ApiError({
        statusCode: 400,
        message: `Provider "${providerKey}" for module "${moduleKey}" is not implemented yet.`,
      });
    }

    validatedModules[moduleKey] = {
      provider: providerKey,
    };
  }

  // Staging in temporary directory in OS temp
  const stagingDir = path.join(
    os.tmpdir(),
    `templategen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  fs.mkdirSync(stagingDir, { recursive: true });

  const stagingServerPath = path.join(stagingDir, cleanServerDir);
  let integratedFilesList = [];
  let copiedModulesList = [];

  try {
    copyBaseTemplate(serverConfig, stagingServerPath);
    const stackRoot = getStackRoot(serverConfig);

    if (Object.keys(validatedModules).length > 0) {
      mergeSelectedDependencies({
        targetPath: stagingServerPath,
        moduleRegistry,
        selectedModules: validatedModules,
      });

      copiedModulesList = copySelectedModuleFiles({
        targetPath: stagingServerPath,
        stackRoot,
        selectedModules: validatedModules,
        moduleRegistry,
      });

      const patchResult = applySelectedModuleIntegrations({
        targetPath: stagingServerPath,
        moduleRegistry,
        selectedModules: validatedModules,
      });

      integratedFilesList =
        patchResult?.integratedFiles?.map((f) =>
          path.relative(stagingServerPath, f),
        ) ?? [];
    }

    const metadata = createProjectMetadata({
      projectName: cleanName,
      client: null,
      server: serverConfig,
      modules: {
        client: {},
        server: validatedModules,
      },
    });

    saveProjectMetadata(stagingDir, metadata);

    // Package the staged directory into a standard ZIP buffer
    const zipBuffer = createZipFromDirectory(stagingDir, cleanName);

    return {
      zipBuffer,
      filename: `${cleanName}.zip`,
      projectName: cleanName,
      serverDirectory: cleanServerDir,
      selectedModules: validatedModules,
      copiedModules: copiedModulesList,
      integratedFiles: integratedFilesList,
      nextSteps: [
        `cd "${cleanName}/${cleanServerDir}"`,
        "npm install",
        "npm start",
      ],
    };
  } finally {
    // Always clean up temporary staging directory
    try {
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}
