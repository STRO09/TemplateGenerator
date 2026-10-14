// All knowledgebase paths are rooted at your repository, not at the shell's current directory.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

export const CLI_DIR = path.resolve(LIB_DIR, "..");
export const REPOSITORY_ROOT = path.resolve(CLI_DIR, "..");
export const KNOWLEDGEBASE_DIR = path.join(REPOSITORY_ROOT, "knowledgebase");

export function loadAvailableTech() {
  const file = path.join(KNOWLEDGEBASE_DIR, "availableTech.json");

  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function resolveInside(root, relativePath, label = "Path") {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be relative: ${relativePath}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} escapes its allowed directory: ${relativePath}`);
  }

  return resolvedPath;
}

export function getStackRoot(server) {
  if (!server?.frameworkKey || !server?.apiFrameworkKey) {
    throw new Error(
      "A supported server framework and API framework are required.",
    );
  }

  const stackRoot = resolveInside(
    KNOWLEDGEBASE_DIR,
    path.join("templates", server.frameworkKey, server.apiFrameworkKey),
    "Template stack",
  );

  if (!fs.existsSync(stackRoot) || !fs.statSync(stackRoot).isDirectory()) {
    throw new Error(`Template stack directory not found: ${stackRoot}`);
  }

  return stackRoot;
}

export function getBaseTemplatePath(server) {
  const templatePath = path.join(getStackRoot(server), "base");

  if (
    !fs.existsSync(templatePath) ||
    !fs.statSync(templatePath).isDirectory()
  ) {
    throw new Error(`Base template directory not found: ${templatePath}`);
  }

  return templatePath;
}

export function loadModuleRegistry(
  type,
  frameworkKey,
  apiFrameworkKey,
  { optional = false } = {},
) {
  if (!type || !frameworkKey || !apiFrameworkKey) {
    if (optional) return null;

    throw new Error(
      "Cannot locate a module registry without a selected stack.",
    );
  }

  const registryPath = resolveInside(
    KNOWLEDGEBASE_DIR,
    path.join("registry", type, frameworkKey, `${apiFrameworkKey}.json`),
    "Module registry",
  );

  if (!fs.existsSync(registryPath)) {
    if (optional) return null;

    throw new Error(`Module registry not found: ${registryPath}`);
  }

  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}
