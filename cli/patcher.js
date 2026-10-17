
import fs from "node:fs";
import { resolveInside } from "./lib/paths.js";
import { applyJavaScriptTransformations } from "./lib/ast-transformer.js";
import { mergeEnvEntries } from "./lib/env-merger.js";

const AST_OPERATIONS = new Set([
  "add-import",
  "add-object-properties",
  "add-switch-case",
  "insert-before-call",
]);

/**
 * Applies selected provider integrations.
 *
 * Registry target paths are relative to targetPath.
 * All transformed contents are staged before any file is written.
 */
export function applySelectedModuleIntegrations({
  targetPath,
  moduleRegistry,
  selectedModules,
}) {
  const stagedFiles = new Map();
  const jsOperations = new Map();
  const envOperations = new Map();

  for (const [moduleKey, selection] of Object.entries(selectedModules ?? {})) {
    const moduleDefinition = moduleRegistry.modules?.[moduleKey];

    if (!moduleDefinition) {
      throw new Error(
        `Selected module "${moduleKey}" is missing from the registry.`,
      );
    }

    const providerKey = selection?.provider;
    const provider = moduleDefinition.providers?.[providerKey];

    if (!provider) {
      throw new Error(
        `Provider "${providerKey}" for module "${moduleKey}" is missing from the registry.`,
      );
    }

    for (const integration of provider.integrations ?? []) {
      if (
        !integration ||
        typeof integration.file !== "string" ||
        !integration.file.trim()
      ) {
        throw new Error(
          `Invalid integration for module "${moduleKey}", provider "${providerKey}".`,
        );
      }

      const targetFile = resolveInside(
        targetPath,
        integration.file,
        "Integration target",
      );

      if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
        throw new Error(
          `Integration target file does not exist: ${targetFile}`,
        );
      }

      if (AST_OPERATIONS.has(integration.operation)) {
        const operations = jsOperations.get(targetFile) ?? [];
        operations.push(integration);
        jsOperations.set(targetFile, operations);
      } else if (integration.operation === "merge-env") {
        if (
          !integration.entries ||
          typeof integration.entries !== "object" ||
          Array.isArray(integration.entries)
        ) {
          throw new Error(
            `"merge-env" requires an "entries" object for ${targetFile}.`,
          );
        }

        const entries = envOperations.get(targetFile) ?? {};
        Object.assign(entries, integration.entries);
        envOperations.set(targetFile, entries);
      } else {
        throw new Error(
          `Unsupported integration operation "${integration.operation}" ` +
          `for module "${moduleKey}".`,
        );
      }
    }
  }

  for (const [targetFile, operations] of jsOperations) {
    const source = fs.readFileSync(targetFile, "utf8");

    stagedFiles.set(
      targetFile,
      applyJavaScriptTransformations(source, operations, targetFile),
    );
  }

  for (const [targetFile, entries] of envOperations) {
    const source = stagedFiles.has(targetFile)
      ? stagedFiles.get(targetFile)
      : fs.readFileSync(targetFile, "utf8");

    stagedFiles.set(targetFile, mergeEnvEntries(source, entries, targetFile));
  }

  // No files are written until all transformations validate successfully.
  for (const [targetFile, contents] of stagedFiles) {
    fs.writeFileSync(targetFile, contents, "utf8");
  }

  if (stagedFiles.size) {
    console.log(`Applied module integrations to ${stagedFiles.size} file(s).`);
  }

  return { integratedFiles: [...stagedFiles.keys()] };
}
